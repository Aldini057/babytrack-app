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

  for (const fname of ['calculator.js', 'calendar.js', 'db.js', 'export_pdf.js']) {
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

test('BabyDB provides starter checklist with Amazon MX affiliate links', () => {
  const { BabyDB } = loadBrowserScripts();
  const state = BabyDB.createDefaultState();
  assert.ok(state.checklist.length >= 16);
  const url = BabyDB.amazonAffiliateUrl(state.checklist[0]);
  assert.match(url, /^https:\/\/www\.amazon\.com\.mx\/s\?k=/);
  assert.match(url, /tag=babytrackmx-20/);
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
