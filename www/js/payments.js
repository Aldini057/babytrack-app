// BabyTrack Mobile — Configuración de Monetización Ética (AdMob, Play Billing / RevenueCat y Amazon MX)
window.BabyMonetization = (() => {
  // Reemplazar con tu Tracking ID real al aprobar tu cuenta en https://afiliados.amazon.com.mx/
  const AMAZON_MX_TAG = 'babytrackmx-20';

  // IDs de prueba oficiales de Google AdMob (seguros para pruebas en APK antes de publicar en Play Store)
  const ADMOB_TEST_BANNER_ANDROID = 'ca-app-pub-3940256099942544/6300978111';

  // Catálogo listo para Google Play Billing / RevenueCat (Fase 2)
  const PLAY_PRODUCTS = {
    BOOK_UNLOCK: { id: 'libro_oro_49', priceMxn: 49, label: 'Libro de Oro Editorial + Sin Anuncios' },
    TIP_CAFE: { id: 'propina_29', priceMxn: 29, label: 'Invitar un café' },
    TIP_PANALES: { id: 'propina_69', priceMxn: 69, label: 'Apoyo con pañales' },
    TIP_SUPER: { id: 'propina_149', priceMxn: 149, label: 'Súper apoyo al proyecto' }
  };

  function getAmazonAffiliateUrl(item) {
    const q = encodeURIComponent(item.amazonQuery || item.itemName || 'bebe');
    return `https://www.amazon.com.mx/s?k=${q}&tag=${AMAZON_MX_TAG}`;
  }

  return {
    AMAZON_MX_TAG,
    ADMOB_TEST_BANNER_ANDROID,
    PLAY_PRODUCTS,
    getAmazonAffiliateUrl
  };
})();
