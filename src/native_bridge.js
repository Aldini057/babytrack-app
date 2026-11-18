import { Capacitor, registerPlugin } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { AdMob, BannerAdPosition, BannerAdSize, BannerAdPluginEvents } from '@capacitor-community/admob';

const CoupleDrive = registerPlugin('CoupleDrive');

let admobInitialized = false;
let bannerCreated = false;
let sizeListenerRegistered = false;
let bannerSizeCallback = null;

function isNative() {
  return Capacitor.isNativePlatform();
}

function emitBannerHeight(height) {
  if (typeof bannerSizeCallback === 'function') {
    bannerSizeCallback(Math.max(0, Number(height || 0)));
  }
}

function onBannerSizeChange(cb) {
  bannerSizeCallback = cb;
}

async function initAdMob() {
  if (!isNative() || admobInitialized) return admobInitialized;
  try {
    if (!sizeListenerRegistered) {
      sizeListenerRegistered = true;
      await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (info) => {
        emitBannerHeight(info?.height || 0);
      });
      await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () => {
        bannerCreated = false;
        emitBannerHeight(0);
      });
    }
    await AdMob.initialize({
      initializeForTesting: true,
    });
    admobInitialized = true;
    return true;
  } catch (err) {
    console.warn('BabyNative initAdMob warning:', err?.message || err);
    return false;
  }
}

async function showBanner(adId) {
  if (!isNative()) return false;
  try {
    if (!admobInitialized) {
      const ok = await initAdMob();
      if (!ok) return false;
    }
    if (bannerCreated) {
      await AdMob.resumeBanner();
      return true;
    }
    const unitId = adId || window.BabyMonetization?.ADMOB_TEST_BANNER_ANDROID || 'ca-app-pub-3940256099942544/6300978111';
    await AdMob.showBanner({
      adId: unitId,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: true,
    });
    bannerCreated = true;
    return true;
  } catch (err) {
    bannerCreated = false;
    emitBannerHeight(0);
    console.warn('BabyNative showBanner warning:', err?.message || err);
    return false;
  }
}

async function hideBanner() {
  if (!isNative()) return false;
  emitBannerHeight(0);
  if (!bannerCreated) return true;
  try {
    await AdMob.hideBanner();
    return true;
  } catch (err) {
    console.warn('BabyNative hideBanner warning:', err?.message || err);
    return false;
  }
}

async function shareImageAndText({ title, text, dataUrl, fileName = 'babytrack-tarjeta.png' }) {
  if (isNative()) {
    try {
      const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      const saved = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });
      await Share.share({
        title: title || 'BabyTrack',
        text: text || '',
        files: [saved.uri],
        dialogTitle: 'Compartir con familia por WhatsApp',
      });
      return { ok: true, mode: 'native' };
    } catch (err) {
      if (String(err?.message || err).toLowerCase().includes('cancel')) {
        return { ok: false, canceled: true };
      }
      console.warn('BabyNative native share failed, falling back:', err);
    }
  }

  // Fallback web/escritorio: descargar PNG + abrir WhatsApp Web
  try {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch {}
  if (text) {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }
  return { ok: true, mode: 'web' };
}

async function authorizeGoogleDrive() {
  if (!isNative()) {
    return {
      ok: false,
      notNative: true,
      error: 'La conexión directa con Google Drive funciona en la app Android. En navegador puedes usar la fusión manual con archivo .json.'
    };
  }
  try {
    const res = await CoupleDrive.authorizeDrive();
    if (!res?.accessToken) {
      return { ok: false, error: 'Google no devolvió un token válido.' };
    }
    return {
      ok: true,
      accessToken: res.accessToken,
      grantedScopes: res.grantedScopes || []
    };
  } catch (err) {
    const msg = err?.message || String(err);
    const canceled = err?.code === 'CANCELED' || msg.toLowerCase().includes('cancel');
    return { ok: false, canceled, error: msg };
  }
}

async function signOutGoogleDrive() {
  if (!isNative()) return { ok: true };
  try {
    await CoupleDrive.signOutDrive();
  } catch {}
  return { ok: true };
}

window.BabyNative = {
  isNative,
  initAdMob,
  showBanner,
  hideBanner,
  onBannerSizeChange,
  shareImageAndText,
  authorizeGoogleDrive,
  signOutGoogleDrive,
};
