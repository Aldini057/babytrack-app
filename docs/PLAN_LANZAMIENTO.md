# 🚀 Plan Maestro de Lanzamiento hacia Google Play (`v1.0.0`) — BabyTrack Mobile

> **Estado base de partida:** `v0.7.0` (`versionCode 9`) — Arquitectura fija **100% Local-First** sobre **Capacitor 7 + Android SDK 35**, almacenamiento privado en `IndexedDB`, estética artesanal **Diario Scrapbook + Semillita Compañera**, monetización ética (AdMob adaptativo inferior, Libro de Oro Editorial de `$49 MXN`, propinas voluntarias y enlaces de afiliado Amazon MX) y compilación automatizada en GitHub Actions.

Este documento define la hoja de ruta técnica, legal y comercial en **6 Fases** para llevar **BabyTrack** desde `v0.7.0` hasta su publicación oficial **`v1.0.0`** en **Google Play Store**.

---

## 📊 Resumen Ejecutivo de las 6 Fases

| Fase | Versión Objetivo | Enfoque Principal | Entregable Clave |
| :--- | :--- | :--- | :--- |
| **Fase 1** | `v0.7.1` (build 10) | **Experiencia Nativa Android, PDF Real y SDK 35** | `BabyPrintPlugin` (`PrintManager`), vista previa con marca de agua, exportación nativa `.json`/`.ics`, botón físico Atrás e insets Edge-to-Edge Android 15. |
| **Fase 2** | `v0.8.0` (build 11+) | **Monetización Real (Play Billing + AdMob Prod)** | Compras reales en Google Play (`libro_oro_49` + propinas + restaurar compras), AdMob productivo con separación debug/release y consentimiento UMP. |
| **Fase 3** | `v0.8.5` (build 12+) | **Notificaciones Locales, Robustez y Salud** | Alertas locales offline (`@capacitor/local-notifications`) 24h/2h antes de citas, persistencia de almacenamiento, visor nativo de PDFs adjuntos y descargos médicos. |
| **Fase 4** | `v0.9.0` (build 13+) | **Seguridad, Firma Release (`.aab`) y Optimización** | Firma con Upload Keystore de producción, generación automática de Android App Bundle (`.aab`), R8/ProGuard, auditoría de permisos y CSP estricta. |
| **Fase 5** | `v0.9.5` (build 14+) | **Cumplimiento Google Play, Privacidad y ASO** | Política de Privacidad pública HTTPS, formulario Data Safety, declaración de Apps de Salud, `app-ads.txt`, ícono final 512×512 y capturas Scrapbook. |
| **Fase 6** | `v1.0.0` (build 15+) | **Prueba Cerrada (14 días), QA Real y Lanzamiento** | Superación de pista cerrada en Play Console, validación de Android Vitals (0 crashes/ANRs) en Android 6–15 y despliegue gradual a Producción. |

---

## 🛠️ Fase 1 (`v0.7.1`, build 10) — Experiencia Nativa Android, Impresión PDF Real y SDK 35

**Objetivo:** Eliminar todas las limitaciones del `WebView` de Android (bloqueo de `window.open`, `window.print()`, descargas `blob:` silenciosas, cierre abrupto con el gesto "Atrás" y traslapes Edge-to-Edge en Android 15).

1. **Impresión y Guardado Nativo en PDF (`BabyPrintPlugin.java`):**
   - Crear plugin Capacitor nativo `com.babytrack.app.BabyPrintPlugin` usando un `WebView` auxiliar en el hilo principal y `android.print.PrintManager` (`createPrintDocumentAdapter`).
   - Registrarlo en `MainActivity.java` y conectarlo con `src/native_bridge.js` (`BabyNative.printHtml`), `www/js/export_pdf.js` y `www/js/app.js`.
   - Permitir imprimir en impresoras Wi-Fi o guardar como PDF real tanto el **Reporte Clínico Obstétrico (Gratis)** como **El Libro de Oro del Embarazo**.
2. **Modal Interno con Marca de Agua para Vista Previa del Libro de Oro:**
   - Mostrar la vista previa gratuita del Libro de Oro dentro de un visor interno de la app con sellos/marca de agua repetida (`VISTA PREVIA · BABYTRACK`), sin abrir pestañas externas ni permitir imprimir hasta desbloquear la edición completa (`$49 MXN`).
   - Habilitar la llamada a `PrintManager` únicamente cuando `state.settings.premiumBookUnlocked === true` (y sin marca de agua).
3. **Exportación Nativa de Respaldos `.json` y Citas `.ics`:**
   - Usar `@capacitor/filesystem` (`Directory.Cache`, codificación UTF-8) + `@capacitor/share` en `BabyNative.exportTextFile` para compartir o guardar en el teléfono/WhatsApp/Drive/Calendario los respaldos completos `.json` y los recordatorios `.ics`, conservando descarga web como respaldo en escritorio.
4. **Botón y Gesto Físico "Atrás" de Android (`@capacitor/app`):**
   - Interceptar `backButton` con jerarquía natural:
     1. Cerrar visores de pantalla completa (`viewerItem`, vista previa del Libro de Oro).
     2. Cerrar drawers y modales activos (`showConsultationDrawer`, `showBookModal`, `showApptModal`, `showStudyModal`, `showShareCardModal`, `showChecklistCostModal`, `showChecklistModal`, `showJournalModal`, `showMomentModal`, `showCalibrateModal`, `showTipModal`).
     3. Si está en otra pestaña (`medico`, `checklist`, `diario`), regresar a `inicio`.
     4. Si ya está en `inicio` sin modales abiertos, salir limpiamente con `App.exitApp()`.
5. **Márgenes Seguros Edge-to-Edge para Android 15 (SDK 35):**
   - Integrar `@capacitor/status-bar` (estilo oscuro sobre fondo claro Scrapbook `#FFFDF7` / `#F3E9DC`).
   - Aplicar `ViewCompat.setOnApplyWindowInsetsListener` en `MainActivity.java` (`systemBars() | displayCutout() | ime()`) para proteger cabecera superior, barra inferior y formularios con teclado abierto en Android 15 (SDK 35) y capas como MagicOS 8.
6. **Verificación y Entrega Continua:**
   - Ampliar `tests/test_offline_logic.mjs`, compilar assets locales (`www/vendor`), sincronizar Capacitor Android, subir versión a `v0.7.1` (`versionCode 10`) y publicar `main` + tag `v0.7.1` para generar el APK en GitHub Actions.

---

## 💳 Fase 2 (`v0.8.0`) — Monetización Real en Producción (Google Play Billing, AdMob y Afiliados)

**Objetivo:** Conectar la pasarela oficial de Google Play y los anuncios productivos manteniendo intacta la regla ética de cero anuncios intrusivos.

1. **Google Play Billing v7 (Compras Integradas Reales):**
   - Integrar plugin de facturación nativa compatible con Capacitor 7 conectado al catálogo definido en `www/js/payments.js`:
     - **Producto único (No consumible):** `libro_oro_49` (`$49 MXN`) — activa `premiumBookUnlocked = true` y `adsRemoved = true`.
     - **Productos de apoyo voluntario (Consumibles):** `propina_29` (`$29 MXN`), `propina_69` (`$69 MXN`) y `propina_149` (`$149 MXN`) — activan `adsRemoved = true` en agradecimiento.
   - Añadir botón obligatorio **"🔄 Restaurar compras anteriores"** en Ajustes y en el modal del Libro de Oro para recuperar `libro_oro_49` tras reinstalar o cambiar de teléfono.
   - Mantener reconocimiento (`acknowledgePurchase`) en menos de 3 días para evitar reembolsos automáticos de Google Play.
2. **AdMob Productivo + Separación Estricta Debug / Release:**
   - Mantener IDs oficiales de prueba (`ca-app-pub-3940256099942544/...`) automáticamente en compilaciones `debug` y cargar `APPLICATION_ID` / `AD_UNIT_ID` reales únicamente en compilaciones firmadas de `release` (protegiendo la cuenta de AdMob contra suspensiones por clics propios).
   - Integrar formulario UMP (*User Messaging Platform*) de Google cuando la región del usuario lo requiera.
3. **Afiliados Amazon México en Producción:**
   - Confirmar el `AMAZON_MX_TAG` definitivo aprobado en Amazon Afiliados México e incluir leyenda visible *"Como Afiliado de Amazon, BabyTrack percibe ingresos por compras adscritas que cumplen los requisitos aplicables"* en la sección de Checklist/Acerca de.

---

## 🔔 Fase 3 (`v0.8.5`) — Notificaciones Locales Offline, Robustez de Datos y UX Clínica

**Objetivo:** Hacer que el seguimiento prenatal funcione de forma proactiva sin internet y cumpla estándares clínicos informativos de Google Play.

1. **Recordatorios Locales Nativos (`@capacitor/local-notifications`):**
   - Programar notificaciones locales automáticas en el dispositivo al crear, editar o eliminar citas médicas, estudios de laboratorio o ultrasonidos (**24 horas antes** y **2 horas antes**), pidiendo permiso `POST_NOTIFICATIONS` en Android 13+ únicamente en contexto cuando la usuaria agenda su primera cita.
   - Notificación semanal opcional cada vez que se cumple una nueva semana gestacional (*"¡Hoy cumples X semanas! Mira el tamaño de tu bebé"*).
2. **Visor/Apertura Nativa de Estudios PDF y Respaldo Seguro:**
   - Permitir abrir PDFs adjuntos en estudios médicos directamente con el visor de PDF del teléfono mediante `Filesystem` + `Share` / `FileOpener`.
   - Solicitar `navigator.storage.persist()` para blindar IndexedDB ante limpiezas automáticas del sistema operativo.
   - Validación estricta de esquema al restaurar respaldos `.json` (sanitización de campos, migración entre versiones y confirmación previa antes de sobrescribir datos).
3. **Aviso Médico Informativo y Accesibilidad:**
   - Incorporar aviso claro no intrusivo en Onboarding, Modo Consulta Médica y Bienestar Fetal: *"BabyTrack es una herramienta informativa y de registro personal; no realiza diagnósticos médicos ni sustituye la valoración de tu ginecólogo u obstetra. Ante disminución de movimientos fetales, sangrado o contracciones regulares, acude de inmediato a urgencias."* (requisito clave en revisiones de Google Play Health).

---

## 🔐 Fase 4 (`v0.9.0`) — Seguridad, Firma de Producción (`.aab`), R8/ProGuard y CI Release

**Objetivo:** Preparar el empaquetado criptográfico y técnico exigido por Google Play Console para SDK 35.

1. **Upload Keystore y Play App Signing:**
   - Generar llave privada de subida (`upload-keystore.jks`, RSA 2048/4096 bits, vigencia >= 25 años), resguardarla fuera del repositorio y cargarla como GitHub Secrets (`PLAY_UPLOAD_KEYSTORE_B64`, `PLAY_KEYSTORE_PASSWORD`, `PLAY_KEY_ALIAS`, `PLAY_KEY_PASSWORD`) separada de `BABYTRACK_DEBUG_KEYSTORE_B64`.
2. **Workflow de Producción (`.aab` + APK Release):**
   - Crear job/workflow `.github/workflows/release-aab.yml` disparado en tags de release para ejecutar `./gradlew bundleRelease`, generando el **Android App Bundle (`BabyTrack-vX.Y.Z.aab`)** listo para subir a Google Play Console.
3. **Optimización R8 / ProGuard y Endurecimiento:**
   - Activar `minifyEnabled true` y `shrinkResources true` en `buildTypes.release` agregando reglas `@Keep` / `-keep` en `android/app/proguard-rules.pro` para `BabyPrintPlugin`, Capacitor Bridge, AdMob y Play Billing.
   - Auditar permisos finales en `AndroidManifest.xml` (sin permisos de almacenamiento heredados ni acceso amplio a galería; selección de fotos mediante selector del sistema), revisar reglas de `android:allowBackup` y configurar `Content-Security-Policy` offline en `www/index.html`.

---

## 📜 Fase 5 (`v0.9.5`) — Cumplimiento Google Play Console, Privacidad y Ficha de Tienda (ASO)

**Objetivo:** Completar todos los requisitos regulatorios y visuales para evitar rechazos en la revisión de Google Play.

1. **Política de Privacidad Pública y `app-ads.txt`:**
   - Publicar micrositio estático gratuito en GitHub Pages (`https://aldini057.github.io/babytrack-app/privacidad` + `/app-ads.txt`) explicando:
     - Almacenamiento **100% local en el dispositivo** (datos de salud materna, ultrasonidos, fotos y cartas nunca se transmiten ni almacenan en servidores de BabyTrack).
     - Uso transparente de Google AdMob (anuncios no sensibles), Google Play Billing (pagos procesados por Google) y enlaces externos a Amazon México.
     - Cómo borrar todos los datos locales desde Ajustes o desinstalando la app.
2. **Cuestionarios Obligatorios en Google Play Console:**
   - **Seguridad de los Datos (*Data Safety*):** Declarar que BabyTrack no recopila ni comparte datos médicos/personales en servidores externos, y declarar únicamente los identificadores técnicos del SDK de AdMob/Play Billing.
   - **Declaración de Apps de Salud (*Health Apps*):** Seleccionar categoría informativa de *"Salud reproductiva y embarazo / Registro personal"* sin conexión a dispositivos médicos regulados.
   - **Clasificación de contenido (IARC) y Público Objetivo:** Dirigida a adultos (`18+`, futuras madres y padres), nunca marcada como app infantil (*Designed for Families* desactivado).
   - **Configuración de anuncios en AdMob:** Bloquear categorías sensibles en el panel de AdMob para mantener un entorno cálido y respetuoso.
3. **Activos Visuales y ASO (México y Latinoamérica):**
   - Ícono adaptativo final en alta resolución (`512×512 PNG` + vectores `ic_launcher_foreground.xml` con estética Semillita/Scrapbook).
   - Gráfico de funciones (`1024×500`), título comercial, descripción corta (80 caracteres), descripción completa optimizada en español (`es-419` / `es-MX`) y 6–8 capturas reales mostrando Inicio Scrapbook, Modo Consulta, Contador de Pataditas, Checklist con control de gasto real, Diario Polaroid y Libro de Oro PDF.

---

## 🏁 Fase 6 (`v1.0.0`) — Prueba Cerrada (14 Días), QA en Dispositivos Reales y Lanzamiento

**Objetivo:** Superar la validación obligatoria de Google Play y publicar `v1.0.0` con estabilidad de grado comercial.

1. **Pista Interna y Prueba Cerrada Obligatoria:**
   - Subir el primer `.aab` firmado a **Prueba Interna** para validar compras de prueba (*License Testers* en Google Play Billing sin cobro real), restauración de compras, impresión PDF y anuncios reales.
   - Promover a **Prueba Cerrada** reclutando al menos **12–20 testers con cuenta Google activa durante 14 días continuos** (requisito vigente de Google Play para cuentas personales nuevas).
2. **QA Físico Multi-Gama y Android Vitals:**
   - Ejecutar matriz completa de pruebas en celulares reales (gama media/baja con fotos pesadas, Android 14 MagicOS 8 y Android 15 SDK 35 con navegación por gestos y por 3 botones).
   - Revisar el **Informe Previo al Lanzamiento (*Pre-launch Report*)** de Firebase Test Lab en Play Console asegurando **0 cierres inesperados (crashes)**, **0 ANRs** y contraste/accesibilidad aprobados.
3. **Lanzamiento Oficial `v1.0.0`:**
   - Solicitar acceso a **Producción** tras cumplirse los 14 días de prueba cerrada.
   - Etiquetar `v1.0.0` (`stage: 'Producción'`), publicar en despliegue gradual (`20%` → `50%` → `100%` en México y Latinoamérica) y monitorear reseñas, Android Vitals y conversiones del Libro de Oro durante las primeras semanas.
