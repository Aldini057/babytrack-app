// BabyTrack Mobile — Configuración de Google Cloud Console para "Sincronizar en Pareja"
// Todos los campos son opcionales hasta que configures tu proyecto en Google Cloud Console.
// La autorización Android (AuthorizationClient con scope drive.file) usa automáticamente
// el paquete com.babytrack.app + huella SHA-1 configurados en Google Cloud Console.
window.BabySyncConfig = {
  // Número de proyecto numérico de Google Cloud Console (necesario como App ID en Google Picker)
  GOOGLE_CLOUD_PROJECT_NUMBER: '1079143066290',
  // API Key de Google Cloud restringida a Google Picker API (usada para que el 2do celular seleccione babytrack-pareja.json)
  GOOGLE_PICKER_API_KEY: 'AIzaSyBaq_K-MMgi5o0yTAvfFn8czRovGiJE0zU',
  // Client ID tipo Web (origen autorizado https://localhost en Capacitor WebView)
  GOOGLE_WEB_CLIENT_ID: '1079143066290-ql4n3mco1gk6fv7d0511jssidmhjl5ht.apps.googleusercontent.com',
  // Nombres predeterminados en Google Drive
  SHARED_FOLDER_PREFIX: 'BabyTrack Pareja',
  SHARED_FILE_NAME: 'babytrack-pareja.json'
};
