// BabyTrack Mobile — Configuración de Google Cloud Console para "Sincronizar en Pareja"
// Todos los campos son opcionales hasta que configures tu proyecto en Google Cloud Console.
// La autorización Android (AuthorizationClient con scope drive.file) usa automáticamente
// el paquete com.babytrack.app + huella SHA-1 configurados en Google Cloud Console.
window.BabySyncConfig = {
  // Número de proyecto numérico de Google Cloud Console (necesario como App ID en Google Picker)
  GOOGLE_CLOUD_PROJECT_NUMBER: '',
  // API Key de Google Cloud restringida a Google Picker API (usada para que el 2do celular seleccione babytrack-pareja.json)
  GOOGLE_PICKER_API_KEY: '',
  // Client ID tipo Web (opcional, requerido solo si tu configuración de Picker lo solicita)
  GOOGLE_WEB_CLIENT_ID: '',
  // Nombres predeterminados en Google Drive
  SHARED_FOLDER_PREFIX: 'BabyTrack Pareja',
  SHARED_FILE_NAME: 'babytrack-pareja.json'
};
