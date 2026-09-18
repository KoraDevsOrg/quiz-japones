const STORAGE_KEY = "koradevs_nihongo_stats_v1";
const MISTAKES_KEY = "koradevs_nihongo_mistakes_v1";

const DEFAULT_STATE = {
  score: 0,
  streak: 0,
  bestStreak: 0,
  total: 0
};

export class StorageService {
  // --- Estadísticas Generales ---
  static load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? { ...DEFAULT_STATE, ...JSON.parse(data) } : { ...DEFAULT_STATE };
    } catch {
      return { ...DEFAULT_STATE };
    }
  }

  static save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("No se pudo guardar el estado en localStorage:", err);
    }
  }

  static reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(MISTAKES_KEY);
    } catch (err) {
      console.warn("Error al reiniciar storage:", err);
    }
    return { ...DEFAULT_STATE };
  }

  // --- Gestión de Errores (Repetición Espaciada) ---
  static getMistakes() {
    try {
      const data = localStorage.getItem(MISTAKES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static addMistake(kana) {
    try {
      const list = this.getMistakes();
      if (!list.includes(kana)) {
        list.push(kana);
        localStorage.setItem(MISTAKES_KEY, JSON.stringify(list));
      }
      return list;
    } catch (err) {
      console.warn("Error guardando fallo:", err);
      return [];
    }
  }

  static removeMistake(kana) {
    try {
      let list = this.getMistakes();
      list = list.filter(k => k !== kana);
      localStorage.setItem(MISTAKES_KEY, JSON.stringify(list));
      return list;
    } catch (err) {
      console.warn("Error eliminando fallo:", err);
      return [];
    }
  }
}
