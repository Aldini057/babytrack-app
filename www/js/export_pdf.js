// BabyTrack Mobile — Sistema Dual de Exportación (Opción A: Clínico Crudo Gratis | Opción B: Libro de Oro Editorial)
window.BabyExport = (() => {
  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Opción A: Expediente Clínico en Crudo (100% Gratuito, blanco y negro, sin diseño editorial)
  function buildRawClinicalHtml(state, metrics) {
    const s = state.settings;
    const appts = [...(state.appointments || [])].sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate));
    const studies = [...(state.studies || [])].sort((a, b) => a.studyDate.localeCompare(b.studyDate));
    const fetal = [...(state.fetalLogs || [])].slice(0, 30);

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Expediente Clínico Crudo - BabyTrack</title>
<style>
  @page { size: letter; margin: 15mm; }
  body { font-family: Arial, sans-serif; color: #111; padding: 20px; line-height: 1.4; max-width: 800px; margin: 0 auto; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  h1 { font-size: 18px; border-bottom: 2px solid #000; padding-bottom: 6px; }
  h2 { font-size: 14px; margin-top: 18px; border-bottom: 1px solid #888; padding-bottom: 3px; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
  th, td { border: 1px solid #999; padding: 6px; text-align: left; }
  th { background: #eee; }
  .meta { font-size: 12px; margin-bottom: 12px; }
  @media print { .no-print { display: none !important; } body { padding: 0; } }
</style>
</head>
<body>
  <div class="no-print" style="margin-bottom:16px;padding:10px;background:#f3f4f6;border:1px solid #d1d5db;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
    <span style="font-size:12px;"><strong>Expediente Clínico en Crudo (Gratuito)</strong> · Usa Imprimir / Guardar como PDF</span>
    <button onclick="window.print()" style="padding:6px 12px;background:#111;color:#fff;border:none;border-radius:6px;font-weight:bold;cursor:pointer;">🖨️ Imprimir / Guardar PDF</button>
  </div>
  <h1>REPORTE CLÍNICO OBSTÉTRICO (DATOS EN CRUDO)</h1>
  <div class="meta">
    <strong>Paciente (Mamá):</strong> ${esc(s.momName)} | <strong>Tipo de sangre:</strong> ${esc(s.momBloodType || 'No especificado')} |
    <strong>FPP:</strong> ${esc(s.dueDate)} | <strong>Edad Gestacional:</strong> ${metrics.weeks} sem + ${metrics.days} días<br>
    <strong>Alergias / Notas médicas:</strong> ${esc(s.allergiesNotes || 'Ninguna registrada')}
  </div>

  <h2>1. Registro de Citas y Signos Vitales</h2>
  ${appts.length === 0 ? '<p style="font-size:12px;">Sin citas registradas.</p>' : `
  <table>
    <thead><tr><th>Fecha</th><th>Tipo</th><th>Sem</th><th>Médico / Clínica</th><th>Peso</th><th>Presión</th><th>FCF</th><th>Notas</th></tr></thead>
    <tbody>
      ${appts.map(a => `<tr>
        <td>${esc((a.appointmentDate || '').replace('T', ' '))}</td>
        <td>${esc(a.appointmentType || 'MEDICO')}</td>
        <td>${a.gestationalWeek}.${a.gestationalDay}</td>
        <td>${esc(a.doctorOrClinic)}</td>
        <td>${a.momWeightKg ? a.momWeightKg + ' kg' : '-'}</td>
        <td>${esc(a.bloodPressure || '-')}</td>
        <td>${a.babyHeartRateBpm ? a.babyHeartRateBpm + ' lpm' : '-'}</td>
        <td>${esc(a.doctorNotesAndDiagnosis || a.questionsForDoctor || '-')}</td>
      </tr>`).join('')}
    </tbody>
  </table>`}

  <h2>2. Diagnósticos, Recetas, Laboratorio y Ecos</h2>
  ${studies.length === 0 ? '<p style="font-size:12px;">Sin estudios registrados.</p>' : `
  <table>
    <thead><tr><th>Fecha</th><th>Categoría</th><th>Sem</th><th>Título</th><th>Resumen / Indicaciones</th></tr></thead>
    <tbody>
      ${studies.map(st => `<tr>
        <td>${esc(st.studyDate)}</td>
        <td>${esc(st.studyType)}</td>
        <td>${st.gestationalWeek}.${st.gestationalDay}</td>
        <td>${esc(st.title)}</td>
        <td>${esc(st.summaryNotes || '-')}</td>
      </tr>`).join('')}
    </tbody>
  </table>`}

  <h2>3. Bitácora de Monitoreo Fetal (Pataditas / Contracciones)</h2>
  ${fetal.length === 0 ? '<p style="font-size:12px;">Sin registros.</p>' : `
  <table>
    <thead><tr><th>Fecha</th><th>Tipo</th><th>Sem</th><th>Detalle</th></tr></thead>
    <tbody>
      ${fetal.map(fl => `<tr>
        <td>${esc((fl.recordedAt || '').slice(0, 16).replace('T', ' '))}</td>
        <td>${esc(fl.logType)}</td>
        <td>${fl.gestationalWeek}.${fl.gestationalDay}</td>
        <td>${fl.logType === 'PATADITAS' ? `${fl.kickCount} movimientos en ${fl.durationSeconds}s` : `Duración ${fl.durationSeconds}s · Intervalo ${fl.intervalMinutes || '-'} min`}</td>
      </tr>`).join('')}
    </tbody>
  </table>`}
</body>
</html>`;
  }

  // Opción B: El Libro de Oro del Embarazo ($49 MXN — Edición Editorial Scrapbook para Imprimir)
  function buildMemoryBookHtml(state, metrics, isPreview = false) {
    const s = state.settings;
    const accents = {
      BOY: { bg: '#EAE5DD', paper: '#FCFBF7', accent: '#3B6E8C', soft: '#E8F1F6', border: '#CBD6DD', tape: 'rgba(154,189,207,0.75)' },
      GIRL: { bg: '#F1E6E4', paper: '#FFFBF9', accent: '#B85C6F', soft: '#FAEBEF', border: '#E4CCD0', tape: 'rgba(226,174,185,0.75)' },
      SURPRISE: { bg: '#F3E9DC', paper: '#FFFDF7', accent: '#C8644B', soft: '#FBEBE5', border: '#DECBB7', tape: 'rgba(223,191,145,0.78)' }
    }[s.genderMode || 'SURPRISE'];

    const ultrasounds = (state.studies || []).filter(st => st.studyType === 'ULTRASONIDO');
    const parentNotes = (state.journal || []).filter(n => n.authorRole !== 'FAMILIA');
    const familyNotes = (state.journal || []).filter(n => n.authorRole === 'FAMILIA');
    const moments = state.moments || [];

    // Construir línea de tiempo por semanas donde haya cualquier recuerdo
    const timelineEvents = [
      ...ultrasounds.map(u => ({ week: u.gestationalWeek, day: u.gestationalDay, date: u.studyDate, kind: '👶 Ultrasonido', title: u.title, body: u.summaryNotes, images: (u.attachments || []).filter(a => a.fileCategory === 'IMAGE').map(a => a.dataUrl) })),
      ...moments.map(m => ({ week: m.gestationalWeek, day: m.gestationalDay, date: m.momentDate, kind: '📸 Momento Especial', title: m.title, body: m.caption, images: m.imageDataUrl ? [m.imageDataUrl] : [] })),
      ...parentNotes.map(n => ({ week: n.gestationalWeek, day: n.gestationalDay, date: (n.createdAt || '').slice(0, 10), kind: n.authorRole === 'MAMA' ? '💌 Carta de Mamá' : '💙 Carta de Papá', title: n.title, body: n.content, images: n.attachedImageDataUrl ? [n.attachedImageDataUrl] : [] }))
    ].sort((a, b) => a.week - b.week || a.day - b.day);

    const previewWatermarkCss = isPreview ? `
  .preview-watermark-layer {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
    overflow: hidden;
  }
  .preview-watermark-stamp {
    font-family: Arial, sans-serif;
    font-size: 22px;
    font-weight: 900;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: rgba(180, 83, 9, 0.16);
    border: 2px dashed rgba(180, 83, 9, 0.22);
    padding: 8px 18px;
    border-radius: 12px;
    transform: rotate(-22deg);
    white-space: nowrap;
    user-select: none;
  }` : '';

    const previewBannerHtml = isPreview
      ? `<div class="watermark">
          <span>🔒 <strong>VISTA PREVIA CON MARCA DE AGUA</strong> · Desbloquea el Libro de Oro ($49 MXN) para imprimir o guardar en PDF sin marca de agua.</span>
        </div>
        <div class="preview-watermark-layer" aria-hidden="true">
          <div class="preview-watermark-stamp">VISTA PREVIA · BABYTRACK · $49 MXN</div>
          <div class="preview-watermark-stamp">MUESTRA NO IMPRIMIBLE · LIBRO DE ORO</div>
          <div class="preview-watermark-stamp">VISTA PREVIA · BABYTRACK · $49 MXN</div>
        </div>`
      : `<div class="watermark no-print">
          <span>✨ Edición Editorial Desbloqueada — Lista para Imprimir o Guardar como PDF</span>
        </div>`;

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>El Libro de Oro de ${esc(s.babyNickname)}</title>
<style>
  @page { size: letter; margin: 16mm; }
  body { position: relative; font-family: Georgia, "Times New Roman", serif; color: #3A2E28; background: ${accents.bg}; margin: 0 auto; max-width: 820px; padding: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cover { position: relative; background: ${accents.paper}; border: 2px dashed ${accents.border}; outline: 6px solid ${accents.paper}; border-radius: 20px; padding: 52px 32px; text-align: center; margin-bottom: 32px; page-break-after: always; box-shadow: 0 10px 26px rgba(58,46,40,0.12); }
  .cover h1 { font-size: 30px; color: ${accents.accent}; margin: 14px 0 8px; }
  .cover .sub { font-size: 16px; color: #7D6E65; font-style: italic; }
  .tape { display: inline-block; width: 120px; height: 22px; background: ${accents.tape}; transform: rotate(-2deg); margin-bottom: 14px; }
  .badge { display: inline-block; padding: 6px 16px; border-radius: 999px; background: ${accents.soft}; color: ${accents.accent}; border: 1.5px dashed ${accents.accent}; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; }
  .chapter { border-left: 4px solid ${accents.accent}; padding: 16px 20px; margin-bottom: 18px; background: ${accents.paper}; border-top: 1px solid ${accents.border}; border-right: 1px solid ${accents.border}; border-bottom: 1px solid ${accents.border}; border-radius: 0 16px 16px 0; break-inside: avoid; box-shadow: 0 4px 12px rgba(58,46,40,0.06); }
  .chapter-meta { font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; color: ${accents.accent}; text-transform: uppercase; letter-spacing: 0.5px; }
  .chapter h3 { margin: 4px 0 8px; font-size: 18px; }
  .chapter p { font-size: 14px; line-height: 1.65; white-space: pre-line; margin: 0; }
  .gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-top: 14px; }
  .gallery img { width: 100%; max-height: 240px; object-fit: cover; border-radius: 6px; padding: 6px 6px 18px 6px; background: #FFFDF9; border: 1px solid ${accents.border}; box-shadow: 0 6px 14px rgba(58,46,40,0.12); box-sizing: border-box; }
  .family-box { background: #FEF5D4; border: 2px dashed #C7A459; border-radius: 16px; padding: 20px; margin-top: 24px; break-inside: avoid; }
  .footprint { background: ${accents.paper}; border: 2px dashed ${accents.accent}; border-radius: 20px; padding: 32px; text-align: center; margin-top: 28px; page-break-before: always; }
  .watermark { background: #FEF3C7; color: #92400E; border: 1px dashed #D97706; padding: 10px 14px; border-radius: 10px; font-family: Arial, sans-serif; font-size: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
  ${previewWatermarkCss}
  @media print { body { background: #fff; padding: 0; } .no-print { display: none !important; } }
</style>
</head>
<body>
  ${previewBannerHtml}

  <section class="cover">
    <div class="tape"></div><br>
    <div style="font-size:56px;">${metrics.sizeEmoji}</div>
    <span class="badge">EDICIÓN DE RECUERDOS · DIARIO BABYTRACK</span>
    <h1>Nuestra Dulce Espera:<br>${esc(s.babyNickname)}</h1>
    <p class="sub">La historia de tus primeros nueve meses, escrita con amor por ${esc(s.momName)} y ${esc(s.dadName)}</p>
    <p style="margin-top:28px;font-family:Arial,sans-serif;font-size:13px;color:#7D6E65;">
      Fecha Prometida (FPP): <strong>${esc(s.dueDate)}</strong><br>
      Avance actual: <strong>Semana ${metrics.weeks}, Día ${metrics.days} (${metrics.progressPercent}%)</strong>
    </p>
  </section>

  <h2 style="color:${accents.accent};border-bottom:2px dashed ${accents.border};padding-bottom:6px;">Capítulo I · Nuestra Historia Semana a Semana</h2>
  ${timelineEvents.length === 0 ? '<p style="font-style:italic;color:#7D6E65;">Aún no has guardado ecos, cartas o fotos para este capítulo. Conforme los agregues aparecerán ordenados automáticamente aquí.</p>' : ''}
  ${timelineEvents.map(ev => `
    <article class="chapter">
      <div class="chapter-meta">Semana ${ev.week}, Día ${ev.day} · ${esc(ev.date)} · ${ev.kind}</div>
      <h3>${esc(ev.title)}</h3>
      ${ev.body ? `<p>${esc(ev.body)}</p>` : ''}
      ${ev.images.length > 0 ? `<div class="gallery">${ev.images.map(src => `<img src="${src}" alt="Recuerdo">`).join('')}</div>` : ''}
    </article>
  `).join('')}

  ${familyNotes.length > 0 ? `
    <section class="family-box">
      <h2 style="margin-top:0;color:#8D6220;">🌳 Capítulo II · Mensajes de Quienes Ya Te Aman</h2>
      ${familyNotes.map(fn => `
        <div style="background:#FFFDF7;padding:12px;border-radius:10px;margin-bottom:10px;border:1px solid #EBD7A0;">
          <strong style="color:#8D6220;">${esc(fn.authorDisplayName)}</strong> <span style="font-size:11px;color:#7D6E65;">(Sem ${fn.gestationalWeek})</span>
          <div style="font-weight:bold;margin:4px 0;">${esc(fn.title)}</div>
          <div style="font-size:13px;white-space:pre-line;">${esc(fn.content)}</div>
        </div>
      `).join('')}
    </section>
  ` : ''}

  <section class="footprint">
    <h2 style="color:${accents.accent};margin-top:0;">👶 El Gran Día de Tu Nacimiento</h2>
    <p style="font-size:13px;color:#7D6E65;">Espacio reservado para cuando llegues a nuestros brazos:</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;text-align:left;margin:24px 0;font-family:Arial,sans-serif;font-size:13px;">
      <div style="border-bottom:1px dashed ${accents.border};padding-bottom:8px;">Fecha y Hora Real: ______________________</div>
      <div style="border-bottom:1px dashed ${accents.border};padding-bottom:8px;">Peso al nacer: ______________________</div>
      <div style="border-bottom:1px dashed ${accents.border};padding-bottom:8px;">Talla (cm): ______________________</div>
      <div style="border-bottom:1px dashed ${accents.border};padding-bottom:8px;">Hospital / Lugar: ______________________</div>
    </div>
    <div style="height:180px;border:2px dashed ${accents.border};border-radius:16px;display:flex;align-items:center;justify-content:center;color:#7D6E65;font-family:Arial,sans-serif;font-size:13px;">
      🐾 Espacio para tus huellitas de recién nacido 🐾
    </div>
  </section>
</body>
</html>`;
  }

  function openDocumentInTab(htmlContent, filenameFallback) {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = typeof window.open === 'function' ? window.open(url, '_blank') : null;
    if (!win && typeof document !== 'undefined') {
      const a = document.createElement('a');
      a.href = url;
      a.download = filenameFallback;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  async function printDocument(htmlContent, jobName = 'BabyTrack-PDF', options = {}) {
    if (options.requireUnlock && !options.isUnlocked) {
      return { ok: false, locked: true, error: 'El Libro de Oro debe estar desbloqueado para imprimir o guardar en PDF.' };
    }
    if (window.BabyNative && typeof window.BabyNative.printHtml === 'function') {
      return await window.BabyNative.printHtml({ html: htmlContent, jobName });
    }
    openDocumentInTab(htmlContent, `${jobName}.html`);
    return { ok: true, mode: 'tab' };
  }

  return {
    buildRawClinicalHtml,
    buildMemoryBookHtml,
    openDocumentInTab,
    printDocument
  };
})();
