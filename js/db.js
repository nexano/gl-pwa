/**
 * IndexedDB wrapper for food database.
 */
const FoodDB = (() => {
  const DB_NAME = 'gl-tracker';
  const DB_VERSION = 1;
  const STORE_NAME = 'foods';
  const DATA_VERSION_KEY = 'gl-tracker-data-v';

  let db = null;
  let allFoods = []; // In-memory cache for fast search

  function open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const database = e.target.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('name_ru', 'name_ru', { unique: false });
          store.createIndex('category', 'category', { unique: false });
        }
      };
      req.onsuccess = (e) => {
        db = e.target.result;
        resolve(db);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async function loadFoods() {
    const currentVersion = '3';
    const storedVersion = localStorage.getItem(DATA_VERSION_KEY);

    if (storedVersion === currentVersion) {
      // Load from IndexedDB
      allFoods = await getAllFromStore();
      if (allFoods.length > 0) return allFoods;
    }

    // Fetch and store
    const resp = await fetch('data/foods.json');
    const foods = await resp.json();

    await clearStore();
    await putAll(foods);
    localStorage.setItem(DATA_VERSION_KEY, currentVersion);

    allFoods = foods;
    return foods;
  }

  function getAllFromStore() {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function clearStore() {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  function putAll(items) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      items.forEach(item => store.put(item));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  function getAll() {
    return allFoods;
  }

  function getCategories() {
    const cats = new Map();
    allFoods.forEach(f => {
      if (!cats.has(f.category)) cats.set(f.category, 0);
      cats.set(f.category, cats.get(f.category) + 1);
    });
    return cats;
  }

  async function init() {
    await open();
    await loadFoods();
    return allFoods;
  }

  return { init, getAll, getCategories };
})();
