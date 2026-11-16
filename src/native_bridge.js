import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { AdMob, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';

let admobInitialized = false;
let bannerVisible = false;

function isNative() {
  return Capacitor.isNativePlatform();
}

async function initAdMob() {
  if (!isNative() || admobInitialized) return false;
  try {
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
    if (bannerVisible) {
      await AdMob.resumeBanner();
      return true;
    }
    const unitId = adId || window.BabyMonetization?.ADMOB_TEST_BANNER_ANDROID || 'ca-app-pub-3940256099942544/6300978111';
    await AdMob.showBanner({
      adId: unitId,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 64,
      isTesting: true,
    });
    bannerVisible = true;
    return true;
  } catch (err) {
    console.warn('BabyNative showBanner warning:', err?.message || err);
    return false;
  }
}

async function hideBanner() {
  if (!isNative() || !bannerVisible) return false;
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

window.BabyNative = {
  isNative,
  initAdMob,
  showBanner,
  hideBanner,
  shareImageAndText,
};
