// BabyTrack Mobile — Generador de Tarjeta Visual PNG (1080x1080 Scrapbook) y Texto Enriquecido para WhatsApp
window.BabyShareCard = (() => {
  const PALETTES = {
    SURPRISE: { bg: '#F3E9DC', kraft: '#EADACA', card: '#FFFDF7', primary: '#C8644B', soft: '#FBEBE5', accent: '#6B8E76', text: '#3A2E28', muted: '#7D6E65', border: '#DECBB7', tape: 'rgba(223, 191, 145, 0.85)' },
    BOY: { bg: '#EAE5DD', kraft: '#DDE4E8', card: '#FCFBF7', primary: '#3B6E8C', soft: '#E8F1F6', accent: '#5D9285', text: '#27323A', muted: '#63737E', border: '#CBD6DD', tape: 'rgba(154, 189, 207, 0.85)' },
    GIRL: { bg: '#F1E6E4', kraft: '#EFE0DD', card: '#FFFBF9', primary: '#B85C6F', soft: '#FAEBEF', accent: '#8C7284', text: '#3B262B', muted: '#7B6066', border: '#E4CCD0', tape: 'rgba(226, 174, 185, 0.85)' }
  };

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawWashiTape(ctx, x, y, w, h, angleDeg, color) {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((angleDeg * Math.PI) / 180);
    ctx.fillStyle = color;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    for (let sx = -w / 2 + 12; sx < w / 2; sx += 20) {
      ctx.beginPath();
      ctx.moveTo(sx, -h / 2);
      ctx.lineTo(sx - 10, h / 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSeedBuddy(ctx, cx, cy, weeks, p) {
    ctx.save();
    ctx.translate(cx, cy);
    // Macetita
    ctx.fillStyle = p.kraft;
    ctx.strokeStyle = p.text;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-48, 32);
    ctx.quadraticCurveTo(0, 48, 48, 32);
    ctx.lineTo(38, 72);
    ctx.quadraticCurveTo(0, 82, -38, 72);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tallo y hojitas según semanas
    if (weeks >= 6) {
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -40);
      ctx.quadraticCurveTo(-4, -68, 0, -90);
      ctx.stroke();

      ctx.fillStyle = p.accent;
      ctx.strokeStyle = p.text;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-2, -62);
      ctx.quadraticCurveTo(-36, -78, -38, -96);
      ctx.quadraticCurveTo(-14, -96, -2, -68);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    if (weeks >= 11) {
      ctx.fillStyle = p.accent;
      ctx.strokeStyle = p.text;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(2, -70);
      ctx.quadraticCurveTo(36, -86, 38, -104);
      ctx.quadraticCurveTo(14, -104, 2, -76);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    if (weeks >= 20) {
      ctx.fillStyle = p.primary;
      ctx.strokeStyle = p.text;
      ctx.lineWidth = 3.5;
      for (let a = 0; a < 5; a++) {
        const ang = (a * Math.PI * 2) / 5 - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * 14, -102 + Math.sin(ang) * 14, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#F6D37A';
      ctx.beginPath();
      ctx.arc(0, -102, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Cuerpo semillita
    ctx.fillStyle = '#D9B68C';
    ctx.strokeStyle = p.text;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, -46);
    ctx.bezierCurveTo(-36, -42, -46, -4, -38, 22);
    ctx.bezierCurveTo(-32, 38, -16, 42, 0, 42);
    ctx.bezierCurveTo(16, 42, 32, 38, 38, 22);
    ctx.bezierCurveTo(46, -4, 36, -42, 0, -46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Carita feliz
    ctx.fillStyle = p.text;
    ctx.beginPath();
    ctx.arc(-14, -4, 5, 0, Math.PI * 2);
    ctx.arc(14, -4, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = p.primary;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.ellipse(-25, 8, 8, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(25, 8, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = p.text;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 5, 10, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function buildWhatsAppText(settings, metrics) {
    const exactAge = BabyCalc.formatGestationalAge(metrics.weeks, metrics.days);
    const genderLine =
      settings.genderMode === 'BOY'
        ? '🩵 ¡Es un niño!'
        : settings.genderMode === 'GIRL'
          ? '🩷 ¡Es una niña!'
          : '✨ Sorpresa en camino';

    const filledBlocks = Math.max(1, Math.round((metrics.progressPercent / 100) * 10));
    const progressBar = '▓'.repeat(filledBlocks) + '░'.repeat(10 - filledBlocks);

    const cloudUrl = (settings.familyCloudEndpoint || '').trim();
    const cloudSection = cloudUrl
      ? `\n\n💌 *Déjanos una cartita privada para el bebé y mira los ecos aquí:*\n${cloudUrl}`
      : '';

    return [
      `🍼 *Actualización de ${settings.babyNickname}*`,
      `${genderLine}`,
      ``,
      `📅 *Edad gestacional:* ${exactAge} (${metrics.trimesterName})`,
      `📊 *Avance:* ${progressBar} *${metrics.progressPercent}%*`,
      `${metrics.sizeEmoji} *Tamaño equivalente hoy:* ${metrics.sizeComparison} (${metrics.sizeWeight})`,
      `⏳ *Faltan:* ${metrics.daysRemaining} días (FPP: ${settings.dueDate})`,
      cloudSection,
      `\n_Enviado con amor por ${settings.momName} y ${settings.dadName} · BabyTrack_`
    ].filter((v) => v !== null && v !== undefined).join('\n').replace(/\n{3,}/g, '\n\n');
  }

  async function generateShareCardDataUrl(settings, metrics, ultrasoundDataUrl = null) {
    const p = PALETTES[settings.genderMode || 'SURPRISE'] || PALETTES.SURPRISE;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // Fondo Kraft cálido con puntitos de papel
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, 1080, 1080);
    ctx.fillStyle = 'rgba(58, 46, 40, 0.05)';
    for (let gx = 20; gx < 1080; gx += 32) {
      for (let gy = 20; gy < 1080; gy += 32) {
        ctx.fillRect(gx, gy, 3, 3);
      }
    }

    // Hoja crema de diario centrada con sombra suave
    ctx.save();
    ctx.shadowColor = 'rgba(58, 46, 40, 0.18)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = p.card;
    roundRect(ctx, 68, 78, 944, 928, 36);
    ctx.fill();
    ctx.restore();

    // Borde cosido tipo cuaderno artesanal
    ctx.save();
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 3;
    ctx.strokeStyle = p.border;
    roundRect(ctx, 88, 98, 904, 888, 26);
    ctx.stroke();
    ctx.restore();

    // Cinta washi arriba sosteniendo la página
    drawWashiTape(ctx, 415, 56, 250, 44, -2, p.tape);

    // Sello del trimestre
    ctx.save();
    ctx.translate(540, 162);
    ctx.rotate(-0.02);
    ctx.fillStyle = p.soft;
    roundRect(ctx, -230, -28, 460, 56, 28);
    ctx.fill();
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = p.primary;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = p.primary;
    ctx.font = 'bold 25px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`DIARIO BABYTRACK · ${metrics.trimesterName.toUpperCase()}`, 540, 171);

    // Apodo del bebé en serif cálida
    ctx.fillStyle = p.text;
    ctx.font = 'bold 54px Georgia, serif';
    ctx.fillText(settings.babyNickname || 'Nuestro Bebé', 540, 252);

    // Edad gestacional inteligente (sin "0 días")
    const exactAge = BabyCalc.formatGestationalAge(metrics.weeks, metrics.days);
    ctx.fillStyle = p.primary;
    ctx.font = 'bold 62px sans-serif';
    ctx.fillText(exactAge, 540, 336);

    // Barra de progreso cálida
    roundRect(ctx, 150, 376, 780, 26, 13);
    ctx.fillStyle = p.kraft;
    ctx.fill();
    const barW = Math.max(40, Math.round((metrics.progressPercent / 100) * 780));
    roundRect(ctx, 150, 376, barW, 26, 13);
    ctx.fillStyle = p.primary;
    ctx.fill();

    ctx.fillStyle = p.muted;
    ctx.font = 'bold 25px sans-serif';
    ctx.fillText(`${metrics.progressPercent}% del camino  ·  Faltan ${metrics.daysRemaining} días  ·  FPP ${settings.dueDate}`, 540, 442);

    if (ultrasoundDataUrl) {
      // Polaroid inclinada para foto del eco con cinta washi
      try {
        const ecoImg = await loadImage(ultrasoundDataUrl);
        ctx.save();
        ctx.translate(365, 660);
        ctx.rotate(-0.03);
        ctx.shadowColor = 'rgba(58, 46, 40, 0.2)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = '#FFFDF9';
        ctx.fillRect(-215, -185, 430, 375);
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = p.border;
        ctx.lineWidth = 3;
        ctx.strokeRect(-215, -185, 430, 375);

        ctx.save();
        ctx.beginPath();
        ctx.rect(-195, -165, 390, 290);
        ctx.clip();
        const scale = Math.max(390 / ecoImg.width, 290 / ecoImg.height);
        const dw = ecoImg.width * scale;
        const dh = ecoImg.height * scale;
        ctx.drawImage(ecoImg, -dw / 2, -20 - dh / 2, dw, dh);
        ctx.restore();

        ctx.fillStyle = p.text;
        ctx.font = 'italic 28px Georgia, serif';
        ctx.fillText('Nuestro eco ♡', 0, 162);
        ctx.restore();

        drawWashiTape(ctx, 295, 456, 135, 32, 8, p.tape);

        // Nota adhesiva a la derecha con Semillita + fruta
        ctx.save();
        ctx.translate(775, 665);
        ctx.rotate(0.025);
        ctx.fillStyle = p.soft;
        roundRect(ctx, -160, -175, 320, 350, 20);
        ctx.fill();
        ctx.strokeStyle = p.border;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.font = '106px sans-serif';
        ctx.fillText(metrics.sizeEmoji, 0, -45);
        ctx.fillStyle = p.text;
        ctx.font = 'bold 28px Georgia, serif';
        ctx.fillText('Tamaño hoy:', 0, 25);
        ctx.fillStyle = p.primary;
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText(metrics.sizeComparison.slice(0, 20), 0, 72);
        ctx.fillStyle = p.muted;
        ctx.font = '24px sans-serif';
        ctx.fillText(metrics.sizeWeight, 0, 122);
        ctx.restore();
      } catch {
        ultrasoundDataUrl = null;
      }
    }

    if (!ultrasoundDataUrl) {
      // Nota kraft izquierda (Semillita compañera) + Polaroid derecha (Fruta/tamaño)
      ctx.save();
      ctx.fillStyle = p.kraft;
      roundRect(ctx, 135, 488, 360, 336, 26);
      ctx.fill();
      ctx.strokeStyle = p.border;
      ctx.lineWidth = 3;
      ctx.stroke();
      drawSeedBuddy(ctx, 315, 665, metrics.weeks, p);
      ctx.fillStyle = p.muted;
      ctx.font = 'italic 24px Georgia, serif';
      ctx.fillText('Tu semillita creciendo', 315, 795);
      ctx.restore();

      ctx.save();
      ctx.translate(730, 656);
      ctx.rotate(0.02);
      ctx.fillStyle = p.soft;
      roundRect(ctx, -205, -168, 410, 336, 26);
      ctx.fill();
      ctx.strokeStyle = p.border;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.font = '122px sans-serif';
      ctx.fillText(metrics.sizeEmoji, 0, -25);
      ctx.fillStyle = p.text;
      ctx.font = 'bold 30px Georgia, serif';
      ctx.fillText(metrics.sizeComparison.slice(0, 22), 0, 58);
      ctx.fillStyle = p.muted;
      ctx.font = '25px sans-serif';
      ctx.fillText(metrics.sizeWeight, 0, 108);
      ctx.restore();

      drawWashiTape(ctx, 665, 470, 130, 32, -6, p.tape);
    }

    // Pie de firma manuscrito
    ctx.fillStyle = p.muted;
    ctx.font = 'italic 28px Georgia, serif';
    ctx.fillText(`Con amor, ${settings.momName} y ${settings.dadName}  ·  BabyTrack`, 540, 942);

    return canvas.toDataURL('image/png');
  }

  return {
    buildWhatsAppText,
    generateShareCardDataUrl
  };
})();
