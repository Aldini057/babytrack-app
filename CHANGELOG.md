# Historial de Versiones — BabyTrack Mobile

Este proyecto sigue **SemVer pre-`1.0.0`** (`0.MINOR.PATCH`) y mantiene sincronizado el `versionCode` de Android para permitir actualizar el APK sobre instalaciones previas sin borrar datos locales ni hacer rollbacks limpios desde GitHub Releases.

<!-- CHANGELOG_ENTRIES -->
## [0.5.0] (build 6) — 2026-11-18
### Limpieza de Interfaz: Sin PIN Interno ni Selector Global de Mamá/Papá
- **Eliminación del bloqueo por PIN interno:** Se quita la pantalla de bloqueo por PIN y su configuración en Ajustes (los usuarios que deseen proteger la app pueden usar el bloqueo nativo de aplicaciones de Android/iOS).
- **Eliminación del botón de cambio Mamá/Papá en cabecera:** La barra superior queda más limpia; la autoría entre `👩 Mamá` y `👨 Papá` se elige directamente al escribir cada carta en el Diario.

## [0.4.0] (build 5) — 2026-11-18
### Estilo Fijo Diario Scrapbook + Semillita y Control de Costo Real en Compras
- **Diseño definitivo Diario Scrapbook + Semillita Compañera:** Fusionado a `main` como estilo fijo de la aplicación (papel kraft offline, cinta washi, Polaroids, hojas rayadas, fuentes locales `Lora`/`Caveat`/`Nunito` e íconos dibujados a mano en navegación, postal WhatsApp y Libro de Oro).
- **Control de costo real en Checklist & Presupuesto:** Al marcar un artículo como comprado se abre un modal para capturar cuánto costó realmente (con botones rápidos para `🎁 Fue regalo ($0)` o `📌 Usar estimado`), permite editar el costo en cualquier momento con `✏️ Editar costo`, reinicia el gasto si se desmarca y muestra en el resumen el gasto real acumulado y el ahorro o diferencia frente a lo estimado.

## [0.4.0-scrapbook.1] (build 4) — 2026-11-18
### Rama Experimental de Diseño: Diario Scrapbook + Semillita Compañera
- **Estética Diario Scrapbook (Opción B):** Fondo cálido de papel kraft con textura ligera offline, tarjetas tipo cuaderno artesanal, cintas washi decorativas, marcos Polaroid inclinados para ultrasonidos y álbum de momentos, notas adhesivas y hojas rayadas para las cartas del diario.
- **Semillita Compañera (Opción C):** Mascota vectorial ligera (`BabyMascot`) que crece semana a semana desde semillita dormida hasta brote, capullo y flor, acompañada de mensajes cálidos con la voz del bebé y saludo personalizado según la hora del día.
- **Tipografía offline ligera (~145 KB):** Fuentes locales `Lora` (editorial), `Caveat` (manuscrita) y `Nunito` (lectura suave) + íconos dibujados a mano en la barra inferior.
- **Coherencia visual total:** Tarjeta PNG de WhatsApp y Libro de Oro actualizados al estilo Scrapbook manteniendo 100% intacta toda la lógica, datos locales y banner inferior AdMob.

## [0.3.0] (build 3) — 2026-11-18
### Corrección de Firma de Paquete y Banner AdMob en Base Inferior
- **Llave de firma fija en CI (`BABYTRACK_DEBUG_KEYSTORE_B64`):** A partir de `v0.3.0` todas las compilaciones futuras se firman con el mismo certificado, permitiendo actualizar el APK encima sin conflictos de paquete ni desinstalar.
- **Banner AdMob Adaptativo pegado abajo:** El anuncio (`ADAPTIVE_BANNER`, `margin: 0`) se ancla al borde inferior absoluto de la app y eleva dinámicamente toda la barra de navegación y el contenido mediante `BannerAdPluginEvents.SizeChanged` sin tapar ningún botón.


## [0.2.0] (build 2) — 2026-11-16
### Fase 1 — Monetización Ética y Compartir Visual
- **Tarjeta visual PNG (`1080×1080`) para WhatsApp:** Genera una tarjeta descargable/compartible junto con el texto enriquecido e incluye opcionalmente la foto del último ultrasonido usando `@capacitor/share` y `@capacitor/filesystem`.
- **Formato inteligente de semanas:** Elimina la redundancia de `"0 días"` (muestra `"10 semanas exactas"` y singular/plural correcto `"1 día"`).
- **Google AdMob real (IDs de prueba):** Integración de `@capacitor-community/admob` con `APPLICATION_ID` oficial de prueba en Android, ocultándose automáticamente en Modo Consulta Médica, Cronómetro de Contracciones, Onboarding y PIN.
- **Botón discreto de propina:** Reemplaza la tarjeta grande del centro por un botón sutil `☕ Apoyar` en la barra superior.
- **Control de versiones pre-1.0:** Sincronización automática de `package.json`, `build.gradle`, `www/js/version.js` y Releases históricos por tag (`v*`).

## [0.1.0] (build 1) — 2026-11-16
### Base Local-First Comercial
- Aplicación Capacitor 7 + Android SDK 35 100% offline con almacenamiento en IndexedDB.
- Calculadora obstétrica exacta de 280 días, citas médicas, laboratorios, ultrasonidos, contador de pataditas, cronómetro de contracciones, checklist con afiliados Amazon MX, diario/álbum, exportación clínica gratuita y Libro de Oro editorial (`$49 MXN`).
- Compilación automática de APK mediante GitHub Actions.
