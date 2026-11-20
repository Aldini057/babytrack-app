// BabyTrack Mobile — Base de Datos 100% Local-First en el Teléfono (IndexedDB + Respaldo JSON)
window.BabyDB = (() => {
  const DB_NAME = 'babytrack_local_db';
  const DB_VERSION = 1;
  const STORE_NAME = 'app_state';
  const STATE_KEY = 'primary_state';

  const DEFAULT_CHECKLIST = [
    { id: 1, category: 'HABITACION', itemName: 'Cuna / Colecho con colchón firme', description: 'Base segura para los primeros meses', trimesterPriority: 2, quantity: 1, estimatedCostMxn: 4500, actualCostMxn: 0, isCompleted: false, completedBy: null, amazonQuery: 'cuna colecho bebe colchón firme' },
    { id: 2, category: 'HABITACION', itemName: 'Sábanas ajustables de algodón (x3)', description: '100% algodón hipoalergénico', trimesterPriority: 2, quantity: 3, estimatedCostMxn: 650, actualCostMxn: 0, isCompleted: false, completedBy: null, amazonQuery: 'sabanas cuna bebe algodon' },
    { id: 3, category: 'HABITACION', itemName: 'Monitor de bebé con cámara', description: 'Audio y visión nocturna', trimesterPriority: 3, quantity: 1, estimatedCostMxn: 1400, actualCostMxn: 0, isCompleted: false, completedBy: null, amazonQuery: 'monitor bebe camara vision nocturna' },
    { id: 4, category: 'TRANSPORTE', itemName: 'Autoasiento / Portabebé certificado', description: 'Obligatorio para salir del hospital', trimesterPriority: 2, quantity: 1, estimatedCostMxn: 3800, actualCostMxn: 0, isCompleted: false, completedBy: null, amazonQuery: 'autoasiento portabebe recien nacido' },
    { id: 5, category: 'TRANSPORTE', itemName: 'Carriola plegable ligera', description: 'Sistema de viaje cómodo', trimesterPriority: 2, quantity: 1, estimatedCostMxn: 5200, actualCostMxn: 0, isCompleted: false, completedBy: null, amazonQuery: 'carriola plegable ligera bebe' },
    { id: 6, category: 'TRANSPORTE', itemName: 'Pañalera tipo mochila térmica', description: 'Con cambiador portátil incluido', trimesterPriority: 2, quantity: 1, estimatedCostMxn: 750, actualCostMxn: 0, isCompleted: false, completedBy: null, amazonQuery: 'panalera mochila termica bebe' },
    { id: 7, category: 'ALIMENTACION', itemName: 'Almohada de lactancia ergonómica', description: 'Soporte para mamá y bebé', trimesterPriority: 2, quantity: 1, estimatedCostMxn: 680, actualCostMxn: 0, isCompleted: false, completedBy: null, amazonQuery: 'almohada lactancia ergonomica' },
    { id: 8, category: 'ALIMENTACION', itemName: 'Extractor de leche eléctrico/manual', description: 'Libre de BPA', trimesterPriority: 3, quantity: 1, estimatedCostMxn: 1650, actualCostMxn: 0, isCompleted: false, completedBy: null, amazonQuery: 'extractor de leche electrico bebe' },
    { id: 9, category: 'ALIMENTACION', itemName: 'Biberones anticólicos (set inicial)', description: 'Tetinas flujo lento recién nacido', trimesterPriority: 3, quantity: 1, estimatedCostMxn: 590, actualCostMxn: 0, isCompleted: false, completedBy: null, amazonQuery: 'biberones anticolicos recien nacido' },
    { id: 10, category: 'HIGIENE', itemName: 'Bañera plegable con termómetro', description: 'Con soporte para recién nacido', trimesterPriority: 2, quantity: 1, estimatedCostMxn: 890, actualCostMxn: 0, isCompleted: false, completedBy: null, amazonQuery: 'banera plegable bebe recien nacido' },
    { id: 11, category: 'HIGIENE', itemName: 'Pañales etapa RN (2 paquetes)', description: 'Pañales suaves con indicador de humedad', trimesterPriority: 3, quantity: 2, estimatedCostMxn: 600, actualCostMxn: 0, isCompleted: false, completedBy: null, amazonQuery: 'panales recien nacido bebe' },
    { id: 12, category: 'HIGIENE', itemName: 'Termómetro digital + Kit uñas/nasal', description: 'Esencial en el botiquín del bebé', trimesterPriority: 3, quantity: 1, estimatedCostMxn: 420, actualCostMxn: 0, isCompleted: false, completedBy: null, amazonQuery: 'kit cuidado bebe termometro aspirador nasal' },
    { id: 13, category: 'ROPA', itemName: 'Pañaleros algodón talla RN y 0-3m (x6)', description: 'Broches frontales fáciles de cambiar', trimesterPriority: 2, quantity: 6, estimatedCostMxn: 850, actualCostMxn: 0, isCompleted: false, completedBy: null, amazonQuery: 'panaleros algodon recien nacido bebe' },
    { id: 14, category: 'ROPA', itemName: 'Muselinas / cobijitas ligeras (x4)', description: 'Para arrullar al bebé', trimesterPriority: 2, quantity: 4, estimatedCostMxn: 550, actualCostMxn: 0, isCompleted: false, completedBy: null, amazonQuery: 'muselinas algodon bebe' },
    { id: 15, category: 'HOSPITAL', itemName: 'Maleta de Mamá (bata, pantuflas, toallas postparto)', description: 'Lista desde la semana 34', trimesterPriority: 3, quantity: 1, estimatedCostMxn: 950, actualCostMxn: 0, isCompleted: false, completedBy: null, amazonQuery: 'toallas maternidad postparto bata' },
    { id: 16, category: 'HOSPITAL', itemName: 'Maleta del Bebé (primera muda, gorrito, pañales)', description: 'Separada en bolsitas por día', trimesterPriority: 3, quantity: 1, estimatedCostMxn: 700, actualCostMxn: 0, isCompleted: false, completedBy: null, amazonQuery: 'primera puesta recien nacido algodon' }
  ];

  function createDefaultState() {
    const futureDue = new Date();
    futureDue.setDate(futureDue.getDate() + 210);
    return {
      schemaVersion: 1,
      nextId: 100,
      settings: {
        onboarded: false,
        babyNickname: 'Nuestro Bebé',
        dueDate: BabyCalc.localIsoDate(futureDue),
        calibrationOffsetDays: 0,
        genderMode: 'SURPRISE',
        momName: 'Mamá',
        dadName: 'Papá',
        activeParent: 'MAMA',
        momBloodType: '',
        allergiesNotes: '',
        premiumBookUnlocked: false,
        adsRemoved: false,
        dismissedMilestones: []
      },
      appointments: [],
      studies: [],
      fetalLogs: [],
      checklist: JSON.parse(JSON.stringify(DEFAULT_CHECKLIST)),
      journal: [],
      moments: []
    };
  }

  function hydrateLoadedState(raw) {
    const def = createDefaultState();
    const merged = Object.assign(def, raw || {});
    merged.settings = Object.assign(def.settings, raw?.settings || {});
    return merged;
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB no soportado'));
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function loadState() {
    try {
      const db = await openDb();
      return await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(STATE_KEY);
        req.onsuccess = () => {
          if (req.result) {
            resolve(hydrateLoadedState(req.result));
          } else {
            resolve(hydrateLoadedState(createDefaultState()));
          }
        };
        req.onerror = () => resolve(hydrateLoadedState(createDefaultState()));
      });
    } catch {
      try {
        const raw = localStorage.getItem(DB_NAME);
        if (raw) {
          return hydrateLoadedState(JSON.parse(raw));
        }
      } catch {}
      return hydrateLoadedState(createDefaultState());
    }
  }

  async function saveState(state) {
    const clean = JSON.parse(JSON.stringify(state));
    try {
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(clean, STATE_KEY);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      try {
        localStorage.setItem(DB_NAME, JSON.stringify(clean));
      } catch {}
    }
  }

  function amazonAffiliateUrl(item) {
    if (window.BabyMonetization && typeof window.BabyMonetization.getAmazonAffiliateUrl === 'function') {
      return window.BabyMonetization.getAmazonAffiliateUrl(item);
    }
    const q = encodeURIComponent(item.amazonQuery || item.itemName || 'bebe');
    return `https://www.amazon.com.mx/s?k=${q}&tag=babytrackmx-20`;
  }

  return {
    loadState,
    saveState,
    createDefaultState,
    amazonAffiliateUrl
  };
})();
