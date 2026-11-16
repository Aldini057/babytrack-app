# 🍼 BabyTrack Mobile App (Comercial · 100% Local-First)

Aplicación móvil comercial de **BabyTrack** construida con arquitectura **100% Local-First** sobre **Capacitor 7 + Android SDK 35** (compatible desde Android 6.0 hasta Android 14 MagicOS 8).

> **Nota:** Este repositorio es independiente de la versión familiar privada en la nube (`Aldini057/babytrack`).

---

## ✨ Características Principales

- **100% Offline y Privada en el Teléfono:** Base de datos local en IndexedDB sin costos de servidor.
- **Compresión de Imágenes en el Dispositivo:** Optimizada para celulares de gama baja y almacenamiento ligero.
- **Cálculo Obstétrico y Onboarding:** Calibración exacta por Fecha Probable de Parto (FPP) o semanas/días.
- **Control Prenatal Completo (5 apartados):** Citas (`MEDICO`, `LABORATORIO`, `ECO`) con alertas `.ics` / Google Calendar 1 día antes, Diagnósticos/Recetas, Laboratorio, Galería de Ecos y Bienestar Fetal (Contador de Pataditas + Cronómetro de Contracciones).
- **Curva de Evolución:** Gráfica y tabla automática de peso materno, presión arterial y latidos del bebé (`FCF`).
- **Estrategia de Monetización Ética:**
  1. **Sistema Dual PDF:** Expediente Clínico en Crudo (**Gratis**) vs. **El Libro de Oro del Embarazo (\$49 MXN)** con diseño editorial listo para imprimir y empastar.
  2. **Checklist con enlaces de Afiliados Amazon MX.**
  3. **Tarro de Propinas por Hitos** (Semanas 12, 24 y 40).
  4. **Banner discreto (AdMob)** que se oculta automáticamente en **Modo Consulta Médica** y durante el **Cronómetro de Contracciones**.
- **Híbrido Familiar:** Comparte el avance por WhatsApp en 1 toque o enlázalo a una vista pública `/familia`.

---

## 📱 Cómo descargar el `.apk` en tu celular (sin Android Studio)

Cada vez que se sube código a `main`, **GitHub Actions** compila automáticamente el archivo instalable:

1. Abre la pestaña **Releases** de este repositorio en el navegador de tu celular (`https://github.com/Aldini057/babytrack-app/releases`).
2. Descarga **`BabyTrack-debug.apk`**.
3. En tu teléfono (ej. Android 14 / MagicOS 8), toca el archivo para instalarlo (acepta *"Instalar aplicaciones de esta fuente"* si es la primera vez).
