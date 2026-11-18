// BabyTrack Mobile — Motor de Sincronización en Pareja (100% Privado vía Google Drive drive.file)
// Sin servidor intermedio (costo $0) + Fusión determinista sin conflictos (Last-Write-Wins + Tombstones)
window.BabySync = (() => {
  const COLLECTIONS = ['appointments', 'studies', 'fetalLogs', 'checklist', 'journal', 'moments'];
  const SHARED_SETTING_KEYS = [
    'onboarded',
    'babyNickname',
    'dueDate',
    'calibrationOffsetDays',
    'genderMode',
    'momName',
    'dadName',
    'momBloodType',
    'allergiesNotes',
    'familyShareCode',
    'familyCloudEndpoint'
  ];

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function generateDeviceId() {
    const rand = Math.random().toString(36).slice(2, 8);
    const ts = Date.now().toString(36);
    return `bt-${ts}-${rand}`;
  }

  function newUid(deviceId) {
    const prefix = deviceId || generateDeviceId();
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 6);
    return `${prefix}-${ts}-${rand}`;
  }

  function createDefaultCoupleSync() {
    return {
      deviceId: generateDeviceId(),
      googleEmail: '',
      googleName: '',
      role: '', // 'CREATOR' | 'PARTNER'
      folderId: '',
      folderName: '',
      fileId: '',
      fileName: '',
      fileWebLink: '',
      partnerEmail: '',
      lastSyncAt: '',
      lastSyncSummary: ''
    };
  }

  function defaultUpdatedAt(item, fallbackIso) {
    if (item && item.updatedAt) return String(item.updatedAt);
    if (item && item.createdAt) return String(item.createdAt);
    if (item && item.recordedAt) return String(item.recordedAt);
    return fallbackIso || '1970-01-01T00:00:00.000Z';
  }

  function ensureSyncMetadata(state, fallbackIso) {
    if (!state || typeof state !== 'object') return state;
    if (!state.settings || typeof state.settings !== 'object') state.settings = {};
    const defaults = createDefaultCoupleSync();
    state.settings.coupleSync = Object.assign(defaults, state.settings.coupleSync || {});
    if (!state.settings.coupleSync.deviceId) {
      state.settings.coupleSync.deviceId = generateDeviceId();
    }
    if (!state.settings.settingsUpdatedAt) {
      state.settings.settingsUpdatedAt = fallbackIso || '1970-01-01T00:00:00.000Z';
    }
    if (!state.deletedTombstones || typeof state.deletedTombstones !== 'object') {
      state.deletedTombstones = {};
    }

    const devId = state.settings.coupleSync.deviceId;
    for (const col of COLLECTIONS) {
      if (!Array.isArray(state[col])) state[col] = [];
      for (const item of state[col]) {
        if (!item || typeof item !== 'object') continue;
        if (!item.syncUid) {
          if (col === 'checklist' && Number(item.id) >= 1 && Number(item.id) <= 16) {
            item.syncUid = `default-check-${item.id}`;
          } else {
            item.syncUid = `${devId}-${item.id != null ? item.id : newUid(devId)}`;
          }
        }
        if (!item.updatedAt) {
          item.updatedAt = defaultUpdatedAt(item, fallbackIso);
        }
      }
    }
    return state;
  }

  function pickNewerItem(a, b) {
    const ta = String(a?.updatedAt || '1970-01-01T00:00:00.000Z');
    const tb = String(b?.updatedAt || '1970-01-01T00:00:00.000Z');
    if (tb > ta) return clone(b);
    if (ta > tb) return clone(a);
    // Empate exacto de timestamp: desempate determinista para convergencia idéntica en ambos celulares
    if (Boolean(b?.isCompleted) !== Boolean(a?.isCompleted)) {
      return b?.isCompleted ? clone(b) : clone(a);
    }
    return JSON.stringify(b).length > JSON.stringify(a).length ? clone(b) : clone(a);
  }

  function sortMergedCollection(col, items) {
    if (col === 'appointments') {
      return items.sort((a, b) => String(b.appointmentDate || '').localeCompare(String(a.appointmentDate || '')));
    }
    if (col === 'studies') {
      return items.sort((a, b) => String(b.studyDate || '').localeCompare(String(a.studyDate || '')) || Number(b.id || 0) - Number(a.id || 0));
    }
    if (col === 'fetalLogs') {
      return items.sort((a, b) => String(b.recordedAt || '').localeCompare(String(a.recordedAt || '')));
    }
    if (col === 'journal') {
      return items.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    }
    if (col === 'moments') {
      return items.sort((a, b) => String(b.momentDate || '').localeCompare(String(a.momentDate || '')) || Number(b.id || 0) - Number(a.id || 0));
    }
    if (col === 'checklist') {
      return items.sort((a, b) => {
        const aDef = String(a.syncUid || '').startsWith('default-check-') ? Number(a.id || 999) : 10000 + Number(a.id || 0);
        const bDef = String(b.syncUid || '').startsWith('default-check-') ? Number(b.id || 999) : 10000 + Number(b.id || 0);
        return aDef - bDef;
      });
    }
    return items;
  }

  // Fusión determinista sin conflictos entre Teléfono Local y Teléfono de Pareja
  function mergeStates(localRaw, remoteRaw) {
    if (!remoteRaw || typeof remoteRaw !== 'object') {
      const onlyLocal = ensureSyncMetadata(clone(localRaw));
      return {
        state: onlyLocal,
        stats: { added: 0, updated: 0, deleted: 0 }
      };
    }

    const local = ensureSyncMetadata(clone(localRaw));
    const remote = ensureSyncMetadata(clone(remoteRaw));
    const merged = clone(local);

    // 1. Mantener SIEMPRE credenciales locales del dispositivo y estado de compras/anuncios local
    const localCoupleSync = clone(local.settings.coupleSync);
    const localAdsRemoved = Boolean(local.settings.adsRemoved);
    const localPremiumUnlocked = Boolean(local.settings.premiumBookUnlocked);
    const localDismissed = Array.isArray(local.settings.dismissedMilestones) ? [...local.settings.dismissedMilestones] : [];

    // 2. Combinar settings compartibles de la pareja (por último cambio settingsUpdatedAt)
    const lSetTime = String(local.settings.settingsUpdatedAt || '1970-01-01T00:00:00.000Z');
    const rSetTime = String(remote.settings.settingsUpdatedAt || '1970-01-01T00:00:00.000Z');
    const remoteWinsSettings = (rSetTime > lSetTime) || (Boolean(remote.settings.onboarded) && !Boolean(local.settings.onboarded));

    if (remoteWinsSettings) {
      for (const k of SHARED_SETTING_KEYS) {
        if (remote.settings[k] !== undefined) {
          merged.settings[k] = clone(remote.settings[k]);
        }
      }
      merged.settings.settingsUpdatedAt = rSetTime;
    }

    // Si alguno completó onboarding, conservar onboarded = true
    merged.settings.onboarded = Boolean(local.settings.onboarded || remote.settings.onboarded);
    merged.settings.coupleSync = localCoupleSync;
    merged.settings.adsRemoved = localAdsRemoved;
    merged.settings.premiumBookUnlocked = localPremiumUnlocked;
    merged.settings.dismissedMilestones = localDismissed;

    // 3. Combinar tombstones (borrados sincronizados)
    const tombstones = {};
    const allTombKeys = new Set([
      ...Object.keys(local.deletedTombstones || {}),
      ...Object.keys(remote.deletedTombstones || {})
    ]);
    const cutoffMs = Date.now() - 180 * 24 * 60 * 60 * 1000;
    for (const uid of allTombKeys) {
      const ld = String(local.deletedTombstones?.[uid] || '');
      const rd = String(remote.deletedTombstones?.[uid] || '');
      const newer = rd > ld ? rd : ld;
      if (newer) {
        const parsedMs = Date.parse(newer);
        if (Number.isNaN(parsedMs) || parsedMs >= cutoffMs) {
          tombstones[uid] = newer;
        }
      }
    }
    merged.deletedTombstones = tombstones;

    // 4. Combinar cada colección por syncUid
    let added = 0;
    let updated = 0;
    let deleted = 0;
    let maxId = Math.max(Number(local.nextId || 100), Number(remote.nextId || 100), 100);
    const usedIds = new Set();

    // Primero registrar IDs fijos de checklist por defecto (1..16)
    for (const item of merged.checklist || []) {
      if (String(item.syncUid || '').startsWith('default-check-') && Number.isFinite(Number(item.id))) {
        usedIds.add(Number(item.id));
      }
    }

    for (const col of COLLECTIONS) {
      const localMap = new Map();
      const remoteMap = new Map();
      for (const item of local[col] || []) {
        if (item && item.syncUid) localMap.set(item.syncUid, item);
      }
      for (const item of remote[col] || []) {
        if (item && item.syncUid) remoteMap.set(item.syncUid, item);
      }

      const allUids = new Set([...localMap.keys(), ...remoteMap.keys()]);
      const combined = [];

      for (const uid of allUids) {
        const lItem = localMap.get(uid);
        const rItem = remoteMap.get(uid);
        let winner = null;
        if (lItem && rItem) {
          winner = pickNewerItem(lItem, rItem);
          if (String(rItem.updatedAt || '') > String(lItem.updatedAt || '')) {
            updated += 1;
          }
        } else if (lItem) {
          winner = clone(lItem);
        } else if (rItem) {
          winner = clone(rItem);
          added += 1;
        }

        if (!winner) continue;

        const delAt = tombstones[uid];
        if (delAt && String(delAt) >= String(winner.updatedAt || '1970-01-01T00:00:00.000Z')) {
          if (lItem) deleted += 1;
          continue;
        }

        // Asegurar que no haya colisión de ID numérico para claves Alpine :key="item.id"
        const isDefaultChecklist = col === 'checklist' && String(uid).startsWith('default-check-');
        if (!isDefaultChecklist) {
          const numId = Number(winner.id);
          if (!Number.isFinite(numId) || usedIds.has(numId)) {
            maxId += 1;
            winner.id = maxId;
          } else {
            maxId = Math.max(maxId, numId);
          }
          usedIds.add(Number(winner.id));
        }

        combined.push(winner);
      }

      merged[col] = sortMergedCollection(col, combined);
    }

    merged.nextId = maxId + 1;
    return {
      state: merged,
      stats: { added, updated, deleted }
    };
  }

  // Limpia datos privados del dispositivo antes de subir el snapshot compartido a Google Drive
  function sanitizeStateForUpload(state) {
    const clean = ensureSyncMetadata(clone(state));
    if (clean.settings) {
      delete clean.settings.coupleSync;
      delete clean.settings.adsRemoved;
      delete clean.settings.premiumBookUnlocked;
      delete clean.settings.dismissedMilestones;
      delete clean.settings.activeParent;
    }
    return clean;
  }

  // --- CLIENTE GOOGLE DRIVE REST API v3 (scope drive.file) ---
  async function driveFetchJson(url, accessToken, options = {}) {
    const headers = Object.assign({
      Authorization: `Bearer ${accessToken}`
    }, options.headers || {});
    const res = await fetch(url, Object.assign({}, options, { headers }));
    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const errBody = await res.json();
        detail = errBody?.error?.message || detail;
      } catch {}
      const err = new Error(detail);
      err.status = res.status;
      throw err;
    }
    if (res.status === 204) return null;
    return await res.json();
  }

  async function fetchGoogleProfile(accessToken) {
    const data = await driveFetchJson(
      'https://www.googleapis.com/drive/v3/about?fields=user(emailAddress,displayName)',
      accessToken
    );
    return {
      email: data?.user?.emailAddress || '',
      displayName: data?.user?.displayName || ''
    };
  }

  async function inspectDriveFile(accessToken, fileId) {
    if (!fileId) return null;
    try {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,parents,trashed,webViewLink,headRevisionId,modifiedTime`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) return null;
      const meta = await res.json();
      if (meta.trashed) return null;
      return {
        meta,
        etag: res.headers.get('ETag') || ''
      };
    } catch {
      return null;
    }
  }

  async function findOrCreateSharedWorkspace(accessToken, babyNickname, existingFolderId, existingFileId) {
    const cfg = window.BabySyncConfig || {};
    const folderPrefix = cfg.SHARED_FOLDER_PREFIX || 'BabyTrack Pareja';
    const fileName = cfg.SHARED_FILE_NAME || 'babytrack-pareja.json';
    const folderName = `${folderPrefix} · ${(babyNickname || 'Nuestro Bebé').trim()}`;

    // 1. Si ya tenemos fileId válido, reutilizarlo
    if (existingFileId) {
      const existing = await inspectDriveFile(accessToken, existingFileId);
      if (existing?.meta?.id) {
        return {
          folderId: existing.meta.parents?.[0] || existingFolderId || '',
          folderName,
          fileId: existing.meta.id,
          fileName: existing.meta.name || fileName,
          fileWebLink: existing.meta.webViewLink || `https://drive.google.com/file/d/${existing.meta.id}/view`
        };
      }
    }

    // 2. Buscar archivo previo creado por BabyTrack en el Drive del usuario
    try {
      const q = encodeURIComponent(`name = '${fileName}' and trashed = false`);
      const found = await driveFetchJson(
        `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,parents,webViewLink)&pageSize=5`,
        accessToken
      );
      const firstFile = found?.files?.[0];
      if (firstFile?.id) {
        return {
          folderId: firstFile.parents?.[0] || existingFolderId || '',
          folderName,
          fileId: firstFile.id,
          fileName: firstFile.name || fileName,
          fileWebLink: firstFile.webViewLink || `https://drive.google.com/file/d/${firstFile.id}/view`
        };
      }
    } catch {}

    // 3. Crear carpeta compartida
    const folder = await driveFetchJson('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', accessToken, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      })
    });

    // 4. Crear archivo JSON maestro dentro de la carpeta
    const file = await driveFetchJson('https://www.googleapis.com/drive/v3/files?fields=id,name,parents,webViewLink', accessToken, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fileName,
        mimeType: 'application/json',
        parents: [folder.id]
      })
    });

    return {
      folderId: folder.id,
      folderName: folder.name || folderName,
      fileId: file.id,
      fileName: file.name || fileName,
      fileWebLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`
    };
  }

  async function shareWithPartner(accessToken, folderId, fileId, partnerEmail) {
    const cleanEmail = String(partnerEmail || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Escribe un correo Gmail válido de tu pareja.');
    }
    // Dar permiso de editor sobre el archivo maestro (y sobre la carpeta para que la vea en "Compartidos conmigo")
    if (folderId) {
      await driveFetchJson(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folderId)}/permissions?sendNotificationEmail=true`,
        accessToken,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'writer',
            type: 'user',
            emailAddress: cleanEmail
          })
        }
      );
    }
    if (fileId) {
      await driveFetchJson(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/permissions?sendNotificationEmail=false`,
        accessToken,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'writer',
            type: 'user',
            emailAddress: cleanEmail
          })
        }
      );
    }
    return { ok: true, partnerEmail: cleanEmail };
  }

  async function downloadSharedFile(accessToken, fileId) {
    const info = await inspectDriveFile(accessToken, fileId);
    if (!info) {
      const err = new Error('No se encontró o no tienes permiso aún sobre el archivo compartido en Drive.');
      err.status = 404;
      throw err;
    }

    const mediaRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!mediaRes.ok) {
      const err = new Error(`No se pudo descargar el archivo compartido (HTTP ${mediaRes.status}).`);
      err.status = mediaRes.status;
      throw err;
    }

    const text = await mediaRes.text();
    let payload = null;
    if (text && text.trim()) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }
    return {
      payload,
      etag: info.etag || mediaRes.headers.get('ETag') || ''
    };
  }

  async function uploadSharedFile(accessToken, fileId, payloadObj, expectedEtag = '') {
    const jsonText = JSON.stringify(payloadObj);
    const bytes = new Blob([jsonText]).size;

    // Si es menor a 4 MB, subida directa media; si es mayor (muchas fotos/ecos), subida resumible
    if (bytes <= 4 * 1024 * 1024) {
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8'
      };
      if (expectedEtag) headers['If-Match'] = expectedEtag;

      const res = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media`,
        {
          method: 'PATCH',
          headers,
          body: jsonText
        }
      );
      if (!res.ok) {
        let msg = `Error al subir cambios (HTTP ${res.status})`;
        try {
          const j = await res.json();
          msg = j?.error?.message || msg;
        } catch {}
        const err = new Error(msg);
        err.status = res.status;
        throw err;
      }
      return await res.json();
    }

    // Subida resumible para archivos grandes con múltiples ecos y Polaroids
    const initHeaders = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Length': String(bytes)
    };
    if (expectedEtag) initHeaders['If-Match'] = expectedEtag;

    const initRes = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=resumable`,
      {
        method: 'PATCH',
        headers: initHeaders,
        body: JSON.stringify({ mimeType: 'application/json' })
      }
    );
    if (!initRes.ok) {
      const err = new Error(`Error al iniciar subida grande (HTTP ${initRes.status})`);
      err.status = initRes.status;
      throw err;
    }
    const uploadUrl = initRes.headers.get('Location');
    if (!uploadUrl) throw new Error('Drive no devolvió URL de subida resumible.');

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: jsonText
    });
    if (!putRes.ok) {
      const err = new Error(`Error al completar subida (HTTP ${putRes.status})`);
      err.status = putRes.status;
      throw err;
    }
    return await putRes.json();
  }

  async function syncWithDrive(localState, getTokenFn, maxRetries = 2) {
    const fileId = localState?.settings?.coupleSync?.fileId;
    if (!fileId) {
      throw new Error('Primero crea o selecciona el archivo compartido en Google Drive.');
    }

    let attempt = 0;
    let currentState = ensureSyncMetadata(clone(localState));

    while (attempt <= maxRetries) {
      const accessToken = await getTokenFn();
      const { payload: remotePayload, etag } = await downloadSharedFile(accessToken, fileId);
      const { state: mergedState, stats } = mergeStates(currentState, remotePayload);
      const uploadBody = sanitizeStateForUpload(mergedState);

      try {
        await uploadSharedFile(accessToken, fileId, uploadBody, etag);
        const nowIso = new Date().toISOString();
        mergedState.settings.coupleSync.lastSyncAt = nowIso;
        mergedState.settings.coupleSync.lastSyncSummary =
          stats.added || stats.updated || stats.deleted
            ? `+${stats.added} nuevos · ${stats.updated} actualizados`
            : 'Todo al día entre ambos celulares';
        return { state: mergedState, stats };
      } catch (err) {
        // 412 Precondition Failed => la pareja subió cambios al mismo tiempo; reintentar fusión
        if (err.status === 412 && attempt < maxRetries) {
          currentState = mergedState;
          attempt += 1;
          continue;
        }
        throw err;
      }
    }
    throw new Error('No se pudo completar la sincronización por conflicto simultáneo. Intenta de nuevo.');
  }

  // --- GOOGLE PICKER API (para el 2do celular bajo scope no-sensible drive.file) ---
  let pickerScriptPromise = null;
  function loadGooglePickerScript() {
    if (window.google && window.google.picker) return Promise.resolve();
    if (pickerScriptPromise) return pickerScriptPromise;

    pickerScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.onload = () => {
        if (!window.gapi) {
          reject(new Error('No se cargó Google API client.'));
          return;
        }
        window.gapi.load('picker', {
          callback: () => resolve(),
          onerror: () => reject(new Error('No se pudo inicializar Google Picker API.'))
        });
      };
      script.onerror = () => reject(new Error('Sin conexión para cargar Google Picker API.'));
      document.head.appendChild(script);
    });
    return pickerScriptPromise;
  }

  async function openPartnerFilePicker(accessToken) {
    const cfg = window.BabySyncConfig || {};
    if (!cfg.GOOGLE_PICKER_API_KEY || !cfg.GOOGLE_CLOUD_PROJECT_NUMBER) {
      return {
        ok: false,
        missingConfig: true,
        error: 'Falta configurar GOOGLE_PICKER_API_KEY y GOOGLE_CLOUD_PROJECT_NUMBER en sync_config.js.'
      };
    }

    await loadGooglePickerScript();
    return await new Promise((resolve) => {
      const docsView = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
        .setIncludeFolders(true)
        .setMimeTypes('application/json')
        .setQuery(cfg.SHARED_FILE_NAME || 'babytrack-pareja.json');

      const picker = new window.google.picker.PickerBuilder()
        .setTitle('Selecciona babytrack-pareja.json compartido')
        .setAppId(String(cfg.GOOGLE_CLOUD_PROJECT_NUMBER))
        .setDeveloperKey(String(cfg.GOOGLE_PICKER_API_KEY))
        .setOAuthToken(accessToken)
        .addView(docsView)
        .setCallback((data) => {
          const action = data?.[window.google.picker.Response.ACTION];
          if (action === window.google.picker.Action.PICKED) {
            const doc = data?.[window.google.picker.Response.DOCUMENTS]?.[0];
            if (doc?.id) {
              resolve({
                ok: true,
                fileId: doc.id,
                fileName: doc.name || 'babytrack-pareja.json',
                fileWebLink: doc.url || `https://drive.google.com/file/d/${doc.id}/view`
              });
            } else {
              resolve({ ok: false, error: 'No se seleccionó ningún archivo.' });
            }
          } else if (action === window.google.picker.Action.CANCEL) {
            resolve({ ok: false, canceled: true });
          }
        })
        .build();

      picker.setVisible(true);
    });
  }

  return {
    COLLECTIONS,
    generateDeviceId,
    newUid,
    createDefaultCoupleSync,
    ensureSyncMetadata,
    mergeStates,
    sanitizeStateForUpload,
    fetchGoogleProfile,
    findOrCreateSharedWorkspace,
    shareWithPartner,
    downloadSharedFile,
    uploadSharedFile,
    syncWithDrive,
    openPartnerFilePicker
  };
})();
