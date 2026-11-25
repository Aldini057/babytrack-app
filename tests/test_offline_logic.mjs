import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wwwJsDir = path.resolve(__dirname, '../www/js');

function loadBrowserScripts(customGlobals = {}) {
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
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    ...customGlobals,
  };
  sandbox.window = sandbox;

  for (const fname of ['calculator.js', 'calendar.js', 'payments.js', 'db.js', 'share_card.js', 'export_pdf.js', 'scrapbook_mascot.js']) {
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

test('BabyShareCard.buildWhatsAppText formats rich message without 0 días redundancy or cloud family link', () => {
  const { BabyShareCard } = loadBrowserScripts();
  const text = BabyShareCard.buildWhatsAppText(
    {
      babyNickname: 'Santi',
      genderMode: 'BOY',
      dueDate: '2027-07-07',
      momName: 'Ana',
      dadName: 'Luis'
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
  assert.doesNotMatch(text, /\/familia/);
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

  const ics = BabyCalendar.buildSingleIcs(appt, 'Santi');
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /TRIGGER:-PT1440M/);
  assert.match(ics, /TRIGGER:-PT120M/);
});

test('BabyExport builds Clinical HTML, watermarked Preview Book, and clean Unlocked Book', async () => {
  const printCalls = [];
  const { BabyDB, BabyCalc, BabyExport } = loadBrowserScripts({
    BabyNative: {
      isNative: () => true,
      printHtml: async (payload) => {
        printCalls.push(payload);
        return { ok: true, mode: 'native', jobName: payload.jobName };
      }
    }
  });
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

  // Vista previa gratuita lleva marca de agua y ningún botón window.print()
  const previewHtml = BabyExport.buildMemoryBookHtml(state, metrics, true);
  assert.match(previewHtml, /VISTA PREVIA CON MARCA DE AGUA/);
  assert.match(previewHtml, /preview-watermark-stamp/);
  assert.doesNotMatch(previewHtml, /window\.print\(\)/);

  // Versión desbloqueada va limpia sin sellos de marca de agua
  const bookHtml = BabyExport.buildMemoryBookHtml(state, metrics, false);
  assert.match(bookHtml, /Nuestra Dulce Espera/);
  assert.match(bookHtml, /Lucía/);
  assert.match(bookHtml, /Abuelita Carmen/);
  assert.doesNotMatch(bookHtml, /VISTA PREVIA CON MARCA DE AGUA/);

  // Bloqueo estricto si no está desbloqueado
  const lockedRes = await BabyExport.printDocument(previewHtml, 'Libro-Bloqueado', {
    requireUnlock: true,
    isUnlocked: false
  });
  assert.equal(lockedRes.ok, false);
  assert.equal(lockedRes.locked, true);
  assert.equal(printCalls.length, 0);

  // Impresión habilitada cuando está desbloqueado
  const unlockedRes = await BabyExport.printDocument(bookHtml, 'Libro-Lucia', {
    requireUnlock: true,
    isUnlocked: true
  });
  assert.equal(unlockedRes.ok, true);
  assert.equal(printCalls.length, 1);
  assert.equal(printCalls[0].jobName, 'Libro-Lucia');
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

  await app.handleChecklistToggle(firstItem);
  assert.equal(app.showChecklistCostModal, true);
  assert.equal(firstItem.isCompleted, false);
  assert.equal(app.checklistCostForm.actualCostMxn, 4500);

  app.checklistCostForm.actualCostMxn = 3900;
  await app.confirmChecklistCost();
  assert.equal(firstItem.isCompleted, true);
  assert.equal(firstItem.actualCostMxn, 3900);
  assert.equal(app.checklistStats.act, 3900);
  assert.equal(app.checklistStats.diff, -600);

  await app.handleChecklistToggle(secondItem);
  app.checklistCostForm.actualCostMxn = 0;
  await app.confirmChecklistCost();
  assert.equal(secondItem.isCompleted, true);
  assert.equal(secondItem.actualCostMxn, 0);
  assert.equal(app.checklistStats.act, 3900);
  assert.equal(app.checklistStats.diff, -1250);

  await app.handleChecklistToggle(firstItem);
  assert.equal(firstItem.isCompleted, false);
  assert.equal(firstItem.actualCostMxn, 0);
  assert.equal(app.checklistStats.act, 0);
});

test('Fase 1: Book preview watermark gate, PrintManager, native .json/.ics export, and Back hierarchy', async () => {
  const printedDocs = [];
  const exportedFiles = [];

  const sandbox = loadBrowserScripts({
    BabyNative: {
      isNative: () => true,
      initStatusBar: async () => true,
      syncStatusBarTheme: async () => true,
      registerBackHandler: async () => true,
      printHtml: async ({ html, jobName }) => {
        printedDocs.push({ html, jobName });
        return { ok: true, mode: 'native', jobName };
      },
      exportTextFile: async (opts) => {
        exportedFiles.push(opts);
        return { ok: true, mode: 'native', uri: `file:///cache/${opts.fileName}` };
      }
    }
  });
  sandbox.BabyDB.saveState = async () => true;
  const appCode = fs.readFileSync(path.join(wwwJsDir, 'app.js'), 'utf-8');
  vm.runInNewContext(appCode, sandbox, { filename: 'app.js' });

  const app = sandbox.babyTrackApp();
  app.notify = () => {};
  app.state.settings.onboarded = true;
  app.state.settings.babyNickname = 'Mateo';

  // 1. Reporte clínico gratuito imprime vía PrintManager directamente
  await app.downloadRawClinicalReport();
  assert.equal(printedDocs.length, 1);
  assert.match(printedDocs[0].jobName, /^Expediente-Clinico-/);

  // 2. Libro de Oro bloqueado: abre modal interno con marca de agua y NO invoca PrintManager
  const lockAttempt = await app.printMemoryBook();
  assert.equal(lockAttempt.locked, true);
  assert.equal(app.showBookPreviewModal, true);
  assert.match(app.bookPreviewHtml, /VISTA PREVIA CON MARCA DE AGUA/);
  assert.equal(printedDocs.length, 1);

  // 3. Al desbloquear el Libro de Oro: quita marca de agua y lanza PrintManager
  await app.unlockMemoryBookDemo();
  assert.equal(app.state.settings.premiumBookUnlocked, true);
  assert.doesNotMatch(app.bookPreviewHtml, /VISTA PREVIA CON MARCA DE AGUA/);
  assert.equal(printedDocs.length, 2);
  assert.match(printedDocs[1].jobName, /^Libro-de-Oro-Mateo-/);

  // 4. Exportación nativa de respaldo .json y cita .ics
  await app.exportFullJsonBackup();
  await app.downloadIcsFor({
    id: 42,
    appointmentType: 'MEDICO',
    appointmentDate: '2026-12-20T09:00',
    doctorOrClinic: 'Dra. Elena',
    gestationalWeek: 18,
    gestationalDay: 3,
    reminderMinutesBefore: 1440
  });
  assert.equal(exportedFiles.length, 2);
  assert.match(exportedFiles[0].fileName, /^respaldo-babytrack-.*\.json$/);
  assert.equal(exportedFiles[1].fileName, 'cita-babytrack-42.ics');
  assert.match(exportedFiles[1].content, /BEGIN:VCALENDAR/);

  // 5. Jerarquía del botón físico "Atrás": visor -> vista previa libro -> modal -> pestaña Inicio -> salir
  app.activeTab = 'diario';
  app.showJournalModal = true;
  app.showBookPreviewModal = true;
  app.viewerItem = { fileCategory: 'IMAGE', dataUrl: 'data:image/png;base64,AA==' };

  assert.equal(app.handleBackAction(), true);
  assert.equal(app.viewerItem, null);
  assert.equal(app.showBookPreviewModal, true);

  assert.equal(app.handleBackAction(), true);
  assert.equal(app.showBookPreviewModal, false);
  assert.equal(app.showJournalModal, true);

  assert.equal(app.handleBackAction(), true);
  assert.equal(app.showJournalModal, false);
  assert.equal(app.activeTab, 'diario');

  assert.equal(app.handleBackAction(), true);
  assert.equal(app.activeTab, 'inicio');

  assert.equal(app.handleBackAction(), false);
});

test('Android native PrintManager plugin and SDK 35 WindowInsets are wired in MainActivity', () => {
  const rootDir = path.resolve(__dirname, '..');
  const pluginJava = fs.readFileSync(
    path.join(rootDir, 'android/app/src/main/java/com/babytrack/app/BabyPrintPlugin.java'),
    'utf-8'
  );
  const mainJava = fs.readFileSync(
    path.join(rootDir, 'android/app/src/main/java/com/babytrack/app/MainActivity.java'),
    'utf-8'
  );

  assert.match(pluginJava, /@CapacitorPlugin\(name = "BabyPrint"\)/);
  assert.match(pluginJava, /PrintManager/);
  assert.match(pluginJava, /createPrintDocumentAdapter/);

  const regIdx = mainJava.indexOf('registerPlugin(BabyPrintPlugin.class)');
  const superIdx = mainJava.indexOf('super.onCreate(savedInstanceState)');
  assert.ok(regIdx !== -1 && superIdx !== -1 && regIdx < superIdx, 'registerPlugin must be called before super.onCreate');
  assert.match(mainJava, /WindowInsetsCompat\.Type\.systemBars\(\)/);
  assert.match(mainJava, /setOnApplyWindowInsetsListener/);
});
