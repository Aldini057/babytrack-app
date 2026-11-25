#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const vendorDir = path.join(rootDir, 'www', 'vendor');

fs.mkdirSync(vendorDir, { recursive: true });

// 1. Copiar Alpine.js local para modo 100% offline
fs.copyFileSync(
  path.join(rootDir, 'node_modules', 'alpinejs', 'dist', 'cdn.min.js'),
  path.join(vendorDir, 'alpine.min.js')
);

// 2. Compilar Tailwind CSS v4 usando Node directamente (compatible con Windows, macOS y Linux)
const tailwindCli = path.join(rootDir, 'node_modules', '@tailwindcss', 'cli', 'dist', 'index.mjs');
execFileSync(
  process.execPath,
  [tailwindCli, '-i', 'src/input.css', '-o', 'www/vendor/tailwind.css', '--minify'],
  { cwd: rootDir, stdio: 'inherit' }
);

// 3. Empaquetar src/native_bridge.js con esbuild (instalando binario nativo si npm omitió postinstall)
let esbuild;
try {
  esbuild = await import('esbuild');
  await esbuild.build({
    entryPoints: [path.join(rootDir, 'src', 'native_bridge.js')],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    outfile: path.join(vendorDir, 'native_bridge.js'),
    minify: true,
  });
} catch {
  const esbuildInstall = path.join(rootDir, 'node_modules', 'esbuild', 'install.js');
  if (fs.existsSync(esbuildInstall)) {
    execFileSync(process.execPath, [esbuildInstall], { cwd: rootDir, stdio: 'inherit' });
  }
  esbuild = await import('esbuild');
  await esbuild.build({
    entryPoints: [path.join(rootDir, 'src', 'native_bridge.js')],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    outfile: path.join(vendorDir, 'native_bridge.js'),
    minify: true,
  });
}

console.log('Web assets built cleanly in www/vendor/');
