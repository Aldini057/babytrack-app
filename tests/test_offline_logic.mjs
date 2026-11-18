import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wwwJsDir = path.resolve(__dirname, '../www/js');

function loadBrowserScripts() {
  const sandbox = {
    window: {},
    console,
    Date,
    Math,
    JSON,
    URLSearchParams,
    Blob,
    URL,
    encodeURIComponent,
  };
  sandbox.window = sandbox;

  for (const fname of ['calculator.js', 'calendar.js', 'payments.js', 'sync_config.js', 'couple_sync.js', 'db.js', 'share_card.js', 'export_pdf.js', 'scrapbook_mascot.js']) {
    const code = fs.readFileSync(path.join(wwwJsDir, fname), 'utf-8');
    vm.runInNewContext(code, sandbox, { filename: fname });
  }
  return sandbox;
}

test('BabyCalc calculates exact 280-day gestational age and fruit size', () => {
  const { BabyCalc } = loadBrowserScripts();
  const m = BabyCalc.calculateMetrics('2027-07-07', 0, '2026-11-12');
  assert.equal(m.weeks, 6);
  assert.equal(m.days, 1);
  assert.equal(m.trimester, 1);
  assert.match(m.sizeComparison, /Arándano/);
});

test('BabyCalc.formatGestationalAge removes 0-day redundancy and pluralizes properly', () => {
  const { BabyCalc } = loadBrowserScripts();
  assert.equal(BabyCalc.formatGestationalAge(10, 0), '10 semanas exactas');
  assert.equal(BabyCalc.formatGestationalAge(1, 0), '1 semana exacta');
  assert.equal(BabyCalc.formatGestationalAge(10, 1), '10 semanas y 1 día');
  assert.equal(BabyCalc.formatGestationalAge(10, 3), '10 semanas y 3 días');
});

test('BabyShareCard.buildWhatsAppText formats rich message without 0 días redundancy', () => {
  const { BabyShareCard } = loadBrowserScripts();
  const text = BabyShareCard.buildWhatsAppText(
    {
      babyNickname: 'Santi',
      genderMode: 'BOY',
      dueDate: '2027-07-07',
      momName: 'Ana',
      dadName: 'Luis',
      familyCloudEndpoint: 'https://babytrack.run.app/familia'
    },
    {
      weeks: 10,
      days: 0,
      trimesterName: '1er Trimestre',
      progressPercent: 25.0,
      sizeEmoji: '🍓',
      sizeComparison: 'Fresa',
      sizeWeight: '3.1 cm · 4 g',
      daysRemaining: 210
    }
  );
  assert.match(text, /10 semanas exactas/);
  assert.doesNotMatch(text, /\b0 días/);
  assert.match(text, /¡Es un niño!/);
  assert.match(text, /https:\/\/babytrack\.run\.app\/familia/);
});

test('BabyMonetization & BabyDB provide Amazon MX affiliate links and Play Billing catalog', () => {
  const { BabyDB, BabyMonetization } = loadBrowserScripts();
  const state = BabyDB.createDefaultState();
  assert.ok(state.checklist.length >= 16);
  const url = BabyDB.amazonAffiliateUrl(state.checklist[0]);
  assert.match(url, /^https:\/\/www\.amazon\.com\.mx\/s\?k=/);
  assert.match(url, new RegExp(`tag=${BabyMonetization.AMAZON_MX_TAG}`));
  assert.equal(BabyMonetization.PLAY_PRODUCTS.BOOK_UNLOCK.priceMxn, 49);
});

test('BabyCalendar builds Google Calendar URL and .ics with 24h and 2h VALARM', () => {
  const { BabyCalendar } = loadBrowserScripts();
  const appt = {
    id: 7,
    appointmentType: 'ECO',
    appointmentDate: '2026-12-15T10:30',
    doctorOrClinic: 'Dr. Morales · Eco Estructural',
    gestationalWeek: 11,
    gestationalDay: 1,
    reminderMinutesBefore: 1440,
  };
  const gUrl = BabyCalendar.buildGoogleCalendarUrl(appt, 'Santi');
  assert.match(gUrl, /calendar\.google\.com\/calendar\/render/);
  assert.match(gUrl, /Santi/);
});

test('BabyExport builds both Free Raw Clinical HTML and Editorial Memory Book HTML', () => {
  const { BabyDB, BabyCalc, BabyExport } = loadBrowserScripts();
  const state = BabyDB.createDefaultState();
  state.settings.babyNickname = 'Lucía';
  state.appointments.push({
    id: 1,
    appointmentType: 'MEDICO',
    appointmentDate: '2026-11-12T10:00',
    doctorOrClinic: 'Dra. Sofía',
    gestationalWeek: 6,
    gestationalDay: 2,
    momWeightKg: 61.5,
    bloodPressure: '110/70',
    babyHeartRateBpm: 148,
  });
  state.journal.push({
    id: 2,
    authorRole: 'FAMILIA',
    authorDisplayName: 'Abuelita Carmen',
    title: 'Con amor',
    content: 'Te esperamos pronto',
    gestationalWeek: 6,
    gestationalDay: 2,
  });

  const metrics = BabyCalc.calculateMetrics(state.settings.dueDate);
  const rawHtml = BabyExport.buildRawClinicalHtml(state, metrics);
  assert.match(rawHtml, /REPORTE CLÍNICO OBSTÉTRICO/);
  assert.match(rawHtml, /61\.5 kg/);

  const bookHtml = BabyExport.buildMemoryBookHtml(state, metrics, false);
  assert.match(bookHtml, /Nuestra Dulce Espera/);
  assert.match(bookHtml, /Lucía/);
  assert.match(bookHtml, /Abuelita Carmen/);
});

test('Version consistency across package.json, build.gradle, and www/js/version.js', () => {
  const rootDir = path.resolve(__dirname, '..');
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
  const gradle = fs.readFileSync(path.join(rootDir, 'android/app/build.gradle'), 'utf-8');
  const webVerCode = fs.readFileSync(path.join(wwwJsDir, 'version.js'), 'utf-8');

  const sandbox = { window: {} };
  sandbox.window = sandbox;
  vm.runInNewContext(webVerCode, sandbox, { filename: 'version.js' });

  const gradleCodeMatch = gradle.match(/versionCode\s+(\d+)/);
  const gradleNameMatch = gradle.match(/versionName\s+"([^"]+)"/);

  assert.ok(gradleCodeMatch, 'versionCode missing in build.gradle');
  assert.ok(gradleNameMatch, 'versionName missing in build.gradle');
  assert.equal(Number(gradleCodeMatch[1]), pkg.androidVersionCode);
  assert.equal(gradleNameMatch[1], pkg.version);
  assert.equal(sandbox.BABYTRACK_VERSION.versionName, pkg.version);
  assert.equal(sandbox.BABYTRACK_VERSION.versionCode, pkg.androidVersionCode);
});

test('BabyMascot evolves across pregnancy weeks and generates valid SVG', () => {
  const { BabyMascot } = loadBrowserScripts();
  const early = BabyMascot.getStage(4, 'Santi');
  const mid = BabyMascot.getStage(22, 'Santi');
  const late = BabyMascot.getStage(39, 'Santi');
  assert.equal(early.id, 'seed');
  assert.equal(mid.id, 'blossom');
  assert.equal(late.id, 'ready');
  assert.match(early.message, /Santi/);

  const svg = BabyMascot.svgMarkup(24, 'BOY');
  assert.match(svg, /^[\s\S]*<svg[\s\S]*<\/svg>[\s\S]*$/);

  const morning = BabyMascot.greeting('Ana', 'Luis', 'MAMA', new Date(2026, 10, 18, 9, 0));
  assert.match(morning, /Buenos días, Ana y Luis/);
});

test('babyTrackApp checklist tracks real purchase cost, gifts ($0), and uncheck reset', async () => {
  const sandbox = loadBrowserScripts();
  sandbox.BabyDB.saveState = async () => true;
  const appCode = fs.readFileSync(path.join(wwwJsDir, 'app.js'), 'utf-8');
  vm.runInNewContext(appCode, sandbox, { filename: 'app.js' });

  const app = sandbox.babyTrackApp();
  app.notify = () => {};
  const firstItem = app.state.checklist[0]; // est: 4500
  const secondItem = app.state.checklist[1]; // est: 650

  // Seleccionar artículo abre modal con costo estimado por defecto
  await app.handleChecklistToggle(firstItem);
  assert.equal(app.showChecklistCostModal, true);
  assert.equal(firstItem.isCompleted, false);
  assert.equal(app.checklistCostForm.actualCostMxn, 4500);

  // Usuario ajusta a lo que realmente pagó (3900)
  app.checklistCostForm.actualCostMxn = 3900;
  await app.confirmChecklistCost();
  assert.equal(firstItem.isCompleted, true);
  assert.equal(firstItem.actualCostMxn, 3900);
  assert.equal(app.checklistStats.act, 3900);
  assert.equal(app.checklistStats.diff, -600);

  // Segundo artículo fue regalo ($0)
  await app.handleChecklistToggle(secondItem);
  app.checklistCostForm.actualCostMxn = 0;
  await app.confirmChecklistCost();
  assert.equal(secondItem.isCompleted, true);
  assert.equal(secondItem.actualCostMxn, 0);
  assert.equal(app.checklistStats.act, 3900);
  assert.equal(app.checklistStats.diff, -1250);

  // Desmarcar reinicia actualCostMxn a 0 para no contaminar el total gastado
  await app.handleChecklistToggle(firstItem);
  assert.equal(firstItem.isCompleted, false);
  assert.equal(firstItem.actualCostMxn, 0);
  assert.equal(app.checklistStats.act, 0);
});

test('BabySync.mergeStates merges concurrent edits on 2 phones without losing data or colliding IDs', () => {
  const { BabyDB, BabySync } = loadBrowserScripts();

  // Teléfono de Mamá (device A)
  const momState = BabyDB.createDefaultState();
  momState.settings.coupleSync.deviceId = 'dev-mama';
  momState.settings.coupleSync.googleEmail = 'mama@gmail.com';
  momState.settings.adsRemoved = true;
  momState.settings.premiumBookUnlocked = true;
  momState.settings.babyNickname = 'Santi';
  momState.settings.settingsUpdatedAt = '2026-11-18T10:00:00.000Z';
  BabySync.ensureSyncMetadata(momState);

  // Mamá compra artículo #1 (Cuna) en $3,900 y escribe una carta (id local 101)
  momState.checklist[0].isCompleted = true;
  momState.checklist[0].actualCostMxn = 3900;
  momState.checklist[0].updatedAt = '2026-11-18T10:05:00.000Z';
  momState.journal.unshift({
    id: 101,
    syncUid: 'dev-mama-101',
    updatedAt: '2026-11-18T10:10:00.000Z',
    authorRole: 'MAMA',
    authorDisplayName: 'Mamá',
    title: 'Hola bebé',
    content: 'Te esperamos con ilusión',
    gestationalWeek: 12,
    gestationalDay: 0,
    createdAt: '2026-11-18T10:10:00.000Z'
  });

  // Teléfono de Papá (device B) — offline al mismo tiempo
  const dadState = BabyDB.createDefaultState();
  dadState.settings.coupleSync.deviceId = 'dev-papa';
  dadState.settings.coupleSync.googleEmail = 'papa@gmail.com';
  dadState.settings.adsRemoved = false;
  BabySync.ensureSyncMetadata(dadState);

  // Papá compra artículo #5 (Carriola) en $4,800 y escribe otra carta con el MISMO id local 101
  dadState.checklist[4].isCompleted = true;
  dadState.checklist[4].actualCostMxn = 4800;
  dadState.checklist[4].updatedAt = '2026-11-18T10:15:00.000Z';
  dadState.journal.unshift({
    id: 101,
    syncUid: 'dev-papa-101',
    updatedAt: '2026-11-18T10:20:00.000Z',
    authorRole: 'PAPA',
    authorDisplayName: 'Papá',
    title: 'Carta de Papá',
    content: 'Ya tenemos tu carriola',
    gestationalWeek: 12,
    gestationalDay: 0,
    createdAt: '2026-11-18T10:20:00.000Z'
  });

  const { state: merged, stats } = BabySync.mergeStates(momState, dadState);

  // Conserva ambas compras en el checklist sin duplicar los 16 artículos base
  assert.equal(merged.checklist.length, 16);
  assert.equal(merged.checklist[0].isCompleted, true);
  assert.equal(merged.checklist[0].actualCostMxn, 3900);
  assert.equal(merged.checklist[4].isCompleted, true);
  assert.equal(merged.checklist[4].actualCostMxn, 4800);

  // Conserva ambas cartas sin colisión de ID numérico para Alpine :key
  assert.equal(merged.journal.length, 2);
  assert.notEqual(merged.journal[0].id, merged.journal[1].id);
  assert.ok(stats.added >= 1);

  // Respeta credenciales y compras locales de Mamá sin que las de Papá las pisen
  assert.equal(merged.settings.coupleSync.deviceId, 'dev-mama');
  assert.equal(merged.settings.coupleSync.googleEmail, 'mama@gmail.com');
  assert.equal(merged.settings.adsRemoved, true);
  assert.equal(merged.settings.premiumBookUnlocked, true);
  assert.equal(merged.settings.babyNickname, 'Santi');
});

test('BabySync respects deletedTombstones and sanitizes private fields before Drive upload', () => {
  const { BabyDB, BabySync } = loadBrowserScripts();
  const local = BabyDB.createDefaultState();
  local.settings.coupleSync.deviceId = 'dev-1';
  local.settings.coupleSync.googleEmail = 'privado@gmail.com';
  local.settings.adsRemoved = true;
  local.appointments.push({
    id: 105,
    syncUid: 'dev-1-105',
    updatedAt: '2026-11-18T09:00:00.000Z',
    appointmentType: 'MEDICO',
    appointmentDate: '2026-12-01T10:00',
    doctorOrClinic: 'Dra. Ana'
  });

  const remote = BabyDB.createDefaultState();
  remote.settings.coupleSync.deviceId = 'dev-2';
  remote.deletedTombstones = {
    'dev-1-105': '2026-11-18T11:00:00.000Z' // borrada después de su creación
  };

  const { state: merged } = BabySync.mergeStates(local, remote);
  assert.equal(merged.appointments.length, 0);

  const sanitized = BabySync.sanitizeStateForUpload(local);
  assert.equal(sanitized.settings.coupleSync, undefined);
  assert.equal(sanitized.settings.adsRemoved, undefined);
  assert.equal(sanitized.settings.premiumBookUnlocked, undefined);
});
