#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const pkgPath = path.join(rootDir, 'package.json');
const gradlePath = path.join(rootDir, 'android/app/build.gradle');
const webVersionPath = path.join(rootDir, 'www/js/version.js');
const changelogPath = path.join(rootDir, 'CHANGELOG.md');

const args = process.argv.slice(2);
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

let nextVersion = pkg.version;
let nextCode = Number(pkg.androidVersionCode || 1);

// Permite pasar nueva versión como argumento posicional (ej. "0.3.0" o "patch"/"minor")
const positional = args.find((a) => !a.startsWith('--'));
const codeFlagIdx = args.indexOf('--code');

if (positional) {
  if (positional === 'patch' || positional === 'minor') {
    const [maj, min, pat] = pkg.version.split('-')[0].split('.').map(Number);
    nextVersion = positional === 'minor' ? `${maj}.${min + 1}.0` : `${maj}.${min}.${pat + 1}`;
  } else {
    if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(positional)) {
      console.error(`Versión inválida "${positional}". Usa formato SemVer, ej: 0.3.0 o 0.9.0-rc1`);
      process.exit(1);
    }
    nextVersion = positional;
  }
  nextCode = Number(pkg.androidVersionCode || 1) + 1;
}

if (codeFlagIdx !== -1 && args[codeFlagIdx + 1]) {
  nextCode = parseInt(args[codeFlagIdx + 1], 10);
}

if (!Number.isInteger(nextCode) || nextCode < 1) {
  console.error(`versionCode inválido: ${nextCode}`);
  process.exit(1);
}

// 1. Actualizar package.json
pkg.version = nextVersion;
pkg.androidVersionCode = nextCode;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');

// 2. Actualizar android/app/build.gradle
let gradle = fs.readFileSync(gradlePath, 'utf-8');
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${nextCode}`);
gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${nextVersion}"`);
fs.writeFileSync(gradlePath, gradle, 'utf-8');

// 3. Actualizar www/js/version.js (visible dentro de la app)
const stage = nextVersion.startsWith('0.') ? 'Pre-lanzamiento (Beta)' : 'Producción';
const webVersionContent = `// Archivo sincronizado automáticamente por scripts/bump-version.mjs
window.BABYTRACK_VERSION = {
  versionName: '${nextVersion}',
  versionCode: ${nextCode},
  stage: '${stage}'
};
`;
fs.writeFileSync(webVersionPath, webVersionContent, 'utf-8');

// 4. Asegurar sección en CHANGELOG.md si se subió a una versión nueva
if (positional && fs.existsSync(changelogPath)) {
  const existing = fs.readFileSync(changelogPath, 'utf-8');
  if (!existing.includes(`## [${nextVersion}]`)) {
    const today = new Date().toISOString().slice(0, 10);
    const entry = `\n## [${nextVersion}] (build ${nextCode}) — ${today}\n- Cambios pendientes de documentar.\n`;
    const marker = '<!-- CHANGELOG_ENTRIES -->';
    if (existing.includes(marker)) {
      fs.writeFileSync(changelogPath, existing.replace(marker, `${marker}\n${entry.trimStart()}`), 'utf-8');
    }
  }
}

console.log(`✅ Versión sincronizada: v${nextVersion} (Android versionCode ${nextCode}, ${stage})`);
