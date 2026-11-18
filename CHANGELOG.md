# Historial de Versiones — BabyTrack Mobile

Este proyecto sigue **SemVer pre-`1.0.0`** (`0.MINOR.PATCH`) y mantiene sincronizado el `versionCode` de Android para permitir actualizar el APK sobre instalaciones previas sin borrar datos locales ni hacer rollbacks limpios desde GitHub Releases.

<!-- CHANGELOG_ENTRIES -->
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
