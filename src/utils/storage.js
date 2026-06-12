// Almacenamiento en memoria de respaldo si localStorage está bloqueado o no disponible (como en WebViews de Instagram/Facebook)
const memoryStorage = {};

export const safeLocalStorage = {
  getItem: (key, fallback = null) => {
    try {
      const val = window.localStorage.getItem(key);
      return val !== null ? val : fallback;
    } catch (e) {
      console.warn(`[STORAGE WARNING] Fallo al leer la clave "${key}" de localStorage:`, e);
      return key in memoryStorage ? memoryStorage[key] : fallback;
    }
  },

  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[STORAGE WARNING] Fallo al escribir la clave "${key}" en localStorage:`, e);
      memoryStorage[key] = String(value);
    }
  },

  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[STORAGE WARNING] Fallo al eliminar la clave "${key}" de localStorage:`, e);
      delete memoryStorage[key];
    }
  }
};
