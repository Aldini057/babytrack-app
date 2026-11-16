// BabyTrack Mobile — Generador de Tarjeta Visual PNG (1080x1080) y Texto Enriquecido para WhatsApp
window.BabyShareCard = (() => {
  const PALETTES = {
    SURPRISE: { bg: '#FFF9F3', card: '#FFFFFF', primary: '#E07A5F', soft: '#FDF0EB', accent: '#81B29A', text: '#2D3142', muted: '#6E7285', border: '#F2E3D5' },
    BOY: { bg: '#F3F8FE', card: '#FFFFFF', primary: '#3B82F6', soft: '#EFF6FF', accent: '#14B8A6', text: '#1E293B', muted: '#64748B', border: '#DBEAFE' },
    GIRL: { bg: '#FFF5F8', card: '#FFFFFF', primary: '#EC4899', soft: '#FDF2F8', accent: '#A855F7', text: '#33202A', muted: '#7C6370', border: '#FCE7F3' }
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

    // Fondo exterior
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, 1080, 1080);

    // Decoración sutil circular
    ctx.fillStyle = p.soft;
    ctx.beginPath();
    ctx.arc(950, 140, 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(130, 940, 210, 0, Math.PI * 2);
    ctx.fill();

    // Tarjeta blanca principal
    ctx.fillStyle = p.card;
    roundRect(ctx, 64, 64, 952, 952, 48);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = p.border;
    ctx.stroke();

    // Cabecera / Píldora
    ctx.fillStyle = p.soft;
    roundRect(ctx, 310, 110, 460, 56, 28);
    ctx.fill();
    ctx.fillStyle = p.primary;
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🍼  BABYTRACK · ${metrics.trimesterName.toUpperCase()}`, 540, 147);

    // Apodo del bebé
    ctx.fillStyle = p.text;
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText(settings.babyNickname || 'Nuestro Bebé', 540, 232);

    // Edad gestacional inteligente (sin "0 días")
    const exactAge = BabyCalc.formatGestationalAge(metrics.weeks, metrics.days);
    ctx.fillStyle = p.primary;
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText(exactAge, 540, 322);

    // Barra de progreso
    roundRect(ctx, 140, 366, 800, 28, 14);
    ctx.fillStyle = '#F1F5F9';
    ctx.fill();
    const barW = Math.max(40, Math.round((metrics.progressPercent / 100) * 800));
    roundRect(ctx, 140, 366, barW, 28, 14);
    ctx.fillStyle = p.primary;
    ctx.fill();

    ctx.fillStyle = p.muted;
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`${metrics.progressPercent}% completado  ·  Faltan ${metrics.daysRemaining} días  ·  FPP ${settings.dueDate}`, 540, 434);

    if (ultrasoundDataUrl) {
      // Diseño con foto de ultrasonido incluida
      try {
        const ecoImg = await loadImage(ultrasoundDataUrl);
        ctx.save();
        roundRect(ctx, 140, 476, 460, 360, 28);
        ctx.clip();
        const scale = Math.max(460 / ecoImg.width, 360 / ecoImg.height);
        const dw = ecoImg.width * scale;
        const dh = ecoImg.height * scale;
        ctx.drawImage(ecoImg, 140 + (460 - dw) / 2, 476 + (360 - dh) / 2, dw, dh);
        ctx.restore();

        // Marco del eco
        ctx.lineWidth = 4;
        ctx.strokeStyle = p.border;
        roundRect(ctx, 140, 476, 460, 360, 28);
        ctx.stroke();

        // Caja tamaño a la derecha
        ctx.fillStyle = p.soft;
        roundRect(ctx, 628, 476, 312, 360, 28);
        ctx.fill();
        ctx.font = '110px sans-serif';
        ctx.fillText(metrics.sizeEmoji, 784, 610);
        ctx.fillStyle = p.text;
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText('Tamaño hoy:', 784, 680);
        ctx.fillStyle = p.primary;
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText(metrics.sizeComparison.slice(0, 22), 784, 725);
        ctx.fillStyle = p.muted;
        ctx.font = '24px sans-serif';
        ctx.fillText(metrics.sizeWeight, 784, 775);
      } catch {
        ultrasoundDataUrl = null;
      }
    }

    if (!ultrasoundDataUrl) {
      // Diseño centrado de fruta/tamaño
      ctx.fillStyle = p.soft;
      roundRect(ctx, 180, 480, 720, 340, 36);
      ctx.fill();

      ctx.font = '136px sans-serif';
      ctx.fillText(metrics.sizeEmoji, 540, 628);

      ctx.fillStyle = p.text;
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText(`Tamaño equivalente: ${metrics.sizeComparison}`, 540, 716);

      ctx.fillStyle = p.muted;
      ctx.font = '28px sans-serif';
      ctx.fillText(metrics.sizeWeight, 540, 768);
    }

    // Pie de firma
    ctx.fillStyle = p.muted;
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`Con amor, ${settings.momName} y ${settings.dadName}  ·  BabyTrack`, 540, 940);

    return canvas.toDataURL('image/png');
  }

  return {
    buildWhatsAppText,
    generateShareCardDataUrl
  };
})();
