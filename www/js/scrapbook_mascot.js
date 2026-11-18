// BabyTrack Mobile — Semillita Compañera & Voz del Bebé (Diseño Scrapbook + Semillita)
window.BabyMascot = (() => {
  const STAGES = [
    {
      maxWeek: 5,
      id: 'seed',
      title: 'Semillita dormida',
      voice: (nick) => `Apenas soy una chispita acomodándome en tu pancita, ${nick} en camino ✨`
    },
    {
      maxWeek: 8,
      id: 'sprout',
      title: 'Primer brote tierno',
      voice: () => '¡Ya late mi corazoncito muy rápido por ti! Me siento súper cuidadito 🌱'
    },
    {
      maxWeek: 11,
      id: 'tiny_leaf',
      title: 'Brote con hojitas',
      voice: () => '¡Ya muevo mis bracitos y deditos diminutos aunque aún no me sientas!'
    },
    {
      maxWeek: 14,
      id: 'bud',
      title: 'Capullito curioso',
      voice: () => 'Esta semana ya tengo uñitas y empiezo a hacer mis primeras muecas 🌿'
    },
    {
      maxWeek: 19,
      id: 'leafy_bud',
      title: 'Capullo fuerte',
      voice: () => '¡Ya siento tus caricias en la panza y pronto sentirás mis maripositas!'
    },
    {
      maxWeek: 24,
      id: 'blossom',
      title: 'Florecita que escucha',
      voice: () => '¡Ya escucho tu voz y tus latidos! Háblame cerquita, me encanta oírte 🌸'
    },
    {
      maxWeek: 29,
      id: 'fruitling',
      title: 'Frutito luminoso',
      voice: () => 'Abro mis ojitos de a poquito y sueño contigo entre patadita y patadita'
    },
    {
      maxWeek: 36,
      id: 'cozy_fruit',
      title: 'Creciendo con fuerza',
      voice: () => 'Cada día estoy más cachetón y juntando fuercitas para abrazarnos pronto 💛'
    },
    {
      maxWeek: 45,
      id: 'ready',
      title: 'Listo para tus brazos',
      voice: () => '¡Ya tengo las maletas listas! Muy pronto nos veremos cara a cara 🌻'
    }
  ];

  function getStage(weeks, babyNickname = 'Nuestro Bebé') {
    const w = Math.max(0, Number(weeks || 0));
    const nick = (babyNickname || 'Nuestro Bebé').trim();
    const found = STAGES.find((s) => w <= s.maxWeek) || STAGES[STAGES.length - 1];
    return {
      id: found.id,
      title: found.title,
      message: found.voice(nick),
      growthStageIndex: STAGES.indexOf(found) + 1,
      totalStages: STAGES.length
    };
  }

  function greeting(momName = 'Mamá', dadName = 'Papá', activeParent = 'MAMA', dateObj = new Date()) {
    const h = dateObj.getHours();
    let prefix = 'Buenas noches';
    let icon = '🌙';
    if (h >= 5 && h < 12) {
      prefix = 'Buenos días';
      icon = '☀️';
    } else if (h >= 12 && h < 19) {
      prefix = 'Buenas tardes';
      icon = '🌤️';
    }
    const m = (momName || 'Mamá').trim();
    const d = (dadName || 'Papá').trim();
    if (activeParent === 'PAPA' && d && d !== 'Papá') {
      return `${prefix}, ${d} y ${m} ${icon}`;
    }
    return `${prefix}, ${m} y ${d} ${icon}`;
  }

  function svgMarkup(weeks, genderMode = 'SURPRISE') {
    const w = Math.max(0, Number(weeks || 0));
    const palette = genderMode === 'BOY'
      ? { pot: '#B9CBD6', potRim: '#9AB2C2', seed: '#D8B998', seedShade: '#C19D77', leaf: '#5D9285', leafLight: '#85B6A9', blush: '#E5989B', flower: '#79A7C3', flowerCenter: '#F6D58E' }
      : genderMode === 'GIRL'
        ? { pot: '#E2C4C9', potRim: '#CE9FA8', seed: '#DFBE9F', seedShade: '#C8A17D', leaf: '#7D9B76', leafLight: '#A2BD9B', blush: '#E48D9F', flower: '#D98598', flowerCenter: '#F9DC97' }
        : { pot: '#D6B89A', potRim: '#C19D7A', seed: '#D9B68C', seedShade: '#BF9568', leaf: '#6B8E76', leafLight: '#93B69D', blush: '#E5957D', flower: '#E89B78', flowerCenter: '#F6D37A' };

    // Base cute face shared by the seed/sprout buddy
    const showStem = w >= 6;
    const showSecondLeaf = w >= 11;
    const showBud = w >= 14 && w < 20;
    const showFlower = w >= 20 && w < 30;
    const showCrown = w >= 30;
    const scaleBody = w < 6 ? 0.84 : w < 14 ? 0.92 : w < 28 ? 1.0 : 1.06;

    return `
      <svg viewBox="0 0 120 120" class="w-full h-full mascot-float" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <!-- Soft warm paper halo -->
        <circle cx="60" cy="64" r="46" fill="currentColor" opacity="0.08"/>
        <circle cx="60" cy="64" r="44" fill="none" stroke="${palette.potRim}" stroke-width="1.5" stroke-dasharray="3 4" opacity="0.55"/>

        <!-- Little kraft pot / nest -->
        <path d="M36 88 Q60 95 84 88 L79 104 Q60 109 41 104 Z" fill="${palette.pot}" stroke="#4E3B31" stroke-width="2" stroke-linejoin="round"/>
        <ellipse cx="60" cy="88" rx="25" ry="6" fill="${palette.potRim}" stroke="#4E3B31" stroke-width="2"/>
        <ellipse cx="60" cy="88" rx="19" ry="3.5" fill="#7D5D46" opacity="0.55"/>

        <g transform="translate(60, 74) scale(${scaleBody}) translate(-60, -74)">
          ${showStem ? `
            <!-- Growing stem -->
            <path d="M60 50 Q58 35 60 22" fill="none" stroke="${palette.leaf}" stroke-width="3.5" stroke-linecap="round"/>
            <!-- Left tender leaf -->
            <path d="M59 38 Q42 30 40 20 Q53 20 59 35 Z" fill="${palette.leaf}" stroke="#4E3B31" stroke-width="1.8" stroke-linejoin="round"/>
            <path d="M58 36 Q48 29 44 23" fill="none" stroke="${palette.leafLight}" stroke-width="1.2" stroke-linecap="round"/>
          ` : ''}

          ${showSecondLeaf ? `
            <!-- Right tender leaf -->
            <path d="M60 33 Q77 25 79 16 Q67 16 60 30 Z" fill="${palette.leafLight}" stroke="#4E3B31" stroke-width="1.8" stroke-linejoin="round"/>
            <path d="M61 31 Q71 25 75 19" fill="none" stroke="${palette.leaf}" stroke-width="1.2" stroke-linecap="round"/>
          ` : ''}

          ${showBud ? `
            <!-- Little closed flower bud -->
            <path d="M60 12 Q67 18 60 25 Q53 18 60 12 Z" fill="${palette.flower}" stroke="#4E3B31" stroke-width="1.8"/>
          ` : ''}

          ${showFlower ? `
            <!-- Blooming blossom -->
            <g transform="translate(60, 17)">
              <circle cx="0" cy="-7" r="5.5" fill="${palette.flower}" stroke="#4E3B31" stroke-width="1.5"/>
              <circle cx="7" cy="-2" r="5.5" fill="${palette.flower}" stroke="#4E3B31" stroke-width="1.5"/>
              <circle cx="4.5" cy="6" r="5.5" fill="${palette.flower}" stroke="#4E3B31" stroke-width="1.5"/>
              <circle cx="-4.5" cy="6" r="5.5" fill="${palette.flower}" stroke="#4E3B31" stroke-width="1.5"/>
              <circle cx="-7" cy="-2" r="5.5" fill="${palette.flower}" stroke="#4E3B31" stroke-width="1.5"/>
              <circle cx="0" cy="0" r="5" fill="${palette.flowerCenter}" stroke="#4E3B31" stroke-width="1.5"/>
            </g>
          ` : ''}

          ${showCrown ? `
            <!-- Radiant sunflower / baby crown -->
            <g transform="translate(60, 17)">
              <circle cx="0" cy="0" r="11" fill="${palette.flowerCenter}" stroke="#4E3B31" stroke-width="1.8"/>
              <circle cx="0" cy="-10" r="4" fill="${palette.flower}" stroke="#4E3B31" stroke-width="1.3"/>
              <circle cx="9" cy="-5" r="4" fill="${palette.flower}" stroke="#4E3B31" stroke-width="1.3"/>
              <circle cx="9" cy="5" r="4" fill="${palette.flower}" stroke="#4E3B31" stroke-width="1.3"/>
              <circle cx="0" cy="10" r="4" fill="${palette.flower}" stroke="#4E3B31" stroke-width="1.3"/>
              <circle cx="-9" cy="5" r="4" fill="${palette.flower}" stroke="#4E3B31" stroke-width="1.3"/>
              <circle cx="-9" cy="-5" r="4" fill="${palette.flower}" stroke="#4E3B31" stroke-width="1.3"/>
              <circle cx="0" cy="0" r="5.5" fill="#FFFDF7" opacity="0.65"/>
            </g>
          ` : ''}

          <!-- Seed / Sprout cozy body -->
          <path d="M60 44 C44 46, 37 64, 41 78 C44 87, 52 90, 60 90 C68 90, 76 87, 79 78 C83 64, 76 46, 60 44 Z"
                fill="${palette.seed}" stroke="#4E3B31" stroke-width="2.2" stroke-linejoin="round"/>
          <!-- Soft highlight & belly -->
          <path d="M47 64 C47 54, 54 49, 60 49" fill="none" stroke="#FFFDF7" stroke-width="2.2" stroke-linecap="round" opacity="0.65"/>
          <ellipse cx="60" cy="76" rx="12" ry="9" fill="${palette.seedShade}" opacity="0.22"/>

          <!-- Tiny arms -->
          <path d="M40 69 Q33 66 34 61" fill="none" stroke="#4E3B31" stroke-width="2" stroke-linecap="round"/>
          <path d="M80 69 Q87 66 86 61" fill="none" stroke="#4E3B31" stroke-width="2" stroke-linecap="round"/>

          <!-- Face: sleeping before week 6, happy awake eyes from week 6+ -->
          ${w < 6 ? `
            <path d="M49 66 Q52 69 55 66" fill="none" stroke="#4E3B31" stroke-width="2" stroke-linecap="round"/>
            <path d="M65 66 Q68 69 71 66" fill="none" stroke="#4E3B31" stroke-width="2" stroke-linecap="round"/>
            <path d="M57 72 Q60 74 63 72" fill="none" stroke="#4E3B31" stroke-width="1.8" stroke-linecap="round"/>
          ` : `
            <circle cx="52" cy="65" r="2.6" fill="#3A2E28"/>
            <circle cx="68" cy="65" r="2.6" fill="#3A2E28"/>
            <circle cx="51.2" cy="64" r="0.9" fill="#FFFDF7"/>
            <circle cx="67.2" cy="64" r="0.9" fill="#FFFDF7"/>
            <path d="M56 71 Q60 75 64 71" fill="none" stroke="#3A2E28" stroke-width="2" stroke-linecap="round"/>
          `}
          <!-- Rosy cheeks -->
          <ellipse cx="47" cy="70" rx="3.4" ry="2.1" fill="${palette.blush}" opacity="0.72"/>
          <ellipse cx="73" cy="70" rx="3.4" ry="2.1" fill="${palette.blush}" opacity="0.72"/>
        </g>
      </svg>
    `;
  }

  return {
    getStage,
    greeting,
    svgMarkup
  };
})();
