import { Capacitor, registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AdMob, BannerAdPosition, BannerAdSize, BannerAdPluginEvents } from '@capacitor-community/admob';

const BabyPrint = registerPlugin('BabyPrint');

let admobInitialized = false;
let bannerCreated = false;
let sizeListenerRegistered = false;
let bannerSizeCallback = null;
let backListenerRegistered = false;
let backHandlerCallback = null;

const THEME_SURFACE_COLORS = {
  BOY: '#FCFBF7',
  GIRL: '#FFFBF9',
  SURPRISE: '#FFFDF7',
};

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

async function initStatusBar(genderMode = 'SURPRISE') {
  if (!isNative()) return false;
  try {
    await StatusBar.show();
    await StatusBar.setStyle({ style: Style.Light });
    const color = THEME_SURFACE_COLORS[genderMode] || THEME_SURFACE_COLORS.SURPRISE;
    await StatusBar.setBackgroundColor({ color });
    return true;
  } catch (err) {
    console.warn('BabyNative initStatusBar warning:', err?.message || err);
    return false;
  }
}

async function syncStatusBarTheme(genderMode = 'SURPRISE') {
  if (!isNative()) return false;
  try {
    await StatusBar.setStyle({ style: Style.Light });
    const color = THEME_SURFACE_COLORS[genderMode] || THEME_SURFACE_COLORS.SURPRISE;
    await StatusBar.setBackgroundColor({ color });
    return true;
  } catch {
    return false;
  }
}

async function registerBackHandler(handler) {
  backHandlerCallback = handler;
  if (!isNative() || backListenerRegistered) return true;
  backListenerRegistered = true;
  try {
    await App.addListener('backButton', () => {
      try {
        const handled = typeof backHandlerCallback === 'function' ? backHandlerCallback() : false;
        if (!handled) {
          App.exitApp();
        }
      } catch (err) {
        console.warn('BabyNative backButton handler error:', err);
        App.exitApp();
      }
    });
    return true;
  } catch (err) {
    backListenerRegistered = false;
    console.warn('BabyNative registerBackHandler warning:', err?.message || err);
    return false;
  }
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

async function printHtml({ html, jobName = 'BabyTrack-PDF' }) {
  if (!html || !String(html).trim()) {
    return { ok: false, error: 'Documento vacío.' };
  }

  if (isNative()) {
    try {
      const res = await BabyPrint.printHtml({ html, jobName });
      return { ok: true, mode: 'native', jobName: res?.jobName || jobName };
    } catch (err) {
      console.warn('BabyNative printHtml failed:', err);
      return { ok: false, error: err?.message || 'No se pudo abrir el gestor de impresión de Android.' };
    }
  }

  // Fallback web/escritorio mediante iframe oculto con window.print()
  try {
    if (typeof document !== 'undefined') {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.srcdoc = html;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch {}
        setTimeout(() => {
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }, 15000);
      };
      return { ok: true, mode: 'web' };
    }
  } catch (err) {
    console.warn('Web print fallback failed:', err);
  }
  return { ok: false, error: 'Impresión no disponible en este entorno.' };
}

async function exportTextFile({
  content,
  fileName,
  mimeType = 'text/plain;charset=utf-8',
  title,
  text,
  dialogTitle,
}) {
  if (isNative()) {
    try {
      const safeName = String(fileName || 'archivo-babytrack.txt').replace(/[\\/:*?"<>|]/g, '-');
      const saved = await Filesystem.writeFile({
        path: safeName,
        data: String(content ?? ''),
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });
      await Share.share({
        title: title || safeName,
        text: text || '',
        files: [saved.uri],
        dialogTitle: dialogTitle || 'Guardar o compartir archivo',
      });
      return { ok: true, mode: 'native', uri: saved.uri };
    } catch (err) {
      if (String(err?.message || err).toLowerCase().includes('cancel')) {
        return { ok: false, canceled: true };
      }
      console.warn('BabyNative exportTextFile failed, falling back to web:', err);
    }
  }

  try {
    const blob = new Blob([String(content ?? '')], { type: mimeType });
    const url = URL.createObjectURL(blob);
    if (typeof document !== 'undefined') {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'archivo-babytrack.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return { ok: true, mode: 'web' };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
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
  initStatusBar,
  syncStatusBarTheme,
  registerBackHandler,
  initAdMob,
  showBanner,
  hideBanner,
  onBannerSizeChange,
  printHtml,
  exportTextFile,
  shareImageAndText,
};
