// BabyTrack Mobile — Motor Obstétrico Local-First (Ciclo exacto de 280 días)
window.BabyCalc = (() => {
  const TOTAL_PREGNANCY_DAYS = 280;

  const SIZE_TABLE = [
    [2, 'Blastocisto microscópico', '0.1 mm · < 1 g', '✨'],
    [4, 'Semilla de amapola', '2 mm · < 1 g', '🌱'],
    [5, 'Sésamo / ajonjolí', '3 mm · < 1 g', '🌾'],
    [6, 'Arándano azul / lenteja', '6 mm · < 1 g', '🫐'],
    [7, 'Lenteja / arándano grande', '1.3 cm · 1 g', '🫐'],
    [8, 'Frambuesa', '1.6 cm · 1 g', '🫐'],
    [9, 'Cereza', '2.3 cm · 2 g', '🍒'],
    [10, 'Fresa', '3.1 cm · 4 g', '🍓'],
    [11, 'Higo', '4.1 cm · 7 g', '🫐'],
    [12, 'Limón verde', '5.4 cm · 14 g', '🍋'],
    [13, 'Durazno pequeño', '7.4 cm · 23 g', '🍑'],
    [14, 'Manzana', '8.7 cm · 43 g', '🍎'],
    [15, 'Naranja', '10.1 cm · 70 g', '🍊'],
    [16, 'Aguacate', '11.6 cm · 100 g', '🥑'],
    [17, 'Pera', '13.0 cm · 140 g', '🍐'],
    [18, 'Pimiento', '14.2 cm · 190 g', '🫑'],
    [20, 'Plátano', '16.4 cm (cabeza-nalga) · 300 g', '🍌'],
    [22, 'Papaya pequeña', '27.8 cm · 430 g', '🥭'],
    [24, 'Elote / mazorca', '30.0 cm · 600 g', '🌽'],
    [27, 'Coliflor', '36.6 cm · 875 g', '🥦'],
    [28, 'Berenjena grande', '37.6 cm · 1.0 kg', '🍆'],
    [30, 'Repollo / col', '39.9 cm · 1.3 kg', '🥬'],
    [32, 'Jícama grande', '42.4 cm · 1.7 kg', '🥔'],
    [34, 'Piña', '45.0 cm · 2.1 kg', '🍍'],
    [36, 'Melón chino', '47.4 cm · 2.6 kg', '🍈'],
    [38, 'Calabaza mediana', '49.8 cm · 3.1 kg', '🎃'],
    [40, 'Sandía', '51.2 cm · 3.4 kg', '🍉'],
    [42, 'Bebé a término listo para nacer', '52+ cm · 3.6+ kg', '👶']
  ];

  function localIsoDate(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function parseIsoDate(iso) {
    if (!iso) return new Date();
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }

  function diffDays(a, b) {
    const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((utcA - utcB) / 86400000);
  }

  function getSizeInfo(weeks) {
    for (const [maxW, label, measure, emoji] of SIZE_TABLE) {
      if (weeks <= maxW) return { label, measure, emoji };
    }
    const last = SIZE_TABLE[SIZE_TABLE.length - 1];
    return { label: last[1], measure: last[2], emoji: last[3] };
  }

  function calculateMetrics(dueDateIso, offsetDays = 0, targetDateIso = null) {
    const due = parseIsoDate(dueDateIso || '2027-07-07');
    const ref = targetDateIso ? parseIsoDate(targetDateIso) : new Date();
    const daysRemaining = diffDays(due, ref);
    const rawElapsed = TOTAL_PREGNANCY_DAYS - daysRemaining + Number(offsetDays || 0);
    const elapsedDays = Math.max(0, Math.min(294, rawElapsed));
    const weeks = Math.floor(elapsedDays / 7);
    const days = elapsedDays % 7;

    let trimester = 1;
    let trimesterName = '1er Trimestre';
    if (weeks >= 28) {
      trimester = 3;
      trimesterName = '3er Trimestre';
    } else if (weeks >= 14) {
      trimester = 2;
      trimesterName = '2do Trimestre';
    }

    const progressPercent = Number(Math.min(100, Math.max(0, (elapsedDays / TOTAL_PREGNANCY_DAYS) * 100)).toFixed(1));
    const size = getSizeInfo(weeks);

    return {
      weeks,
      days,
      elapsedDays,
      daysRemaining: Math.max(0, daysRemaining),
      trimester,
      trimesterName,
      progressPercent,
      sizeComparison: size.label,
      sizeWeight: size.measure,
      sizeEmoji: size.emoji,
      currentDate: localIsoDate(ref)
    };
  }

  function calculateOffsetFromWeeksDays(dueDateIso, targetWeeks, targetDays) {
    const due = parseIsoDate(dueDateIso || '2027-07-07');
    const today = new Date();
    const baseElapsed = TOTAL_PREGNANCY_DAYS - diffDays(due, today);
    const desiredElapsed = Number(targetWeeks) * 7 + Number(targetDays);
    return desiredElapsed - baseElapsed;
  }

  function formatGestationalAge(weeks, days) {
    const w = Number(weeks || 0);
    const d = Number(days || 0);
    const wLabel = w === 1 ? '1 semana' : `${w} semanas`;
    if (d === 0) return w === 1 ? '1 semana exacta' : `${w} semanas exactas`;
    if (d === 1) return `${wLabel} y 1 día`;
    return `${wLabel} y ${d} días`;
  }

  return {
    localIsoDate,
    calculateMetrics,
    calculateOffsetFromWeeksDays,
    formatGestationalAge
  };
})();
