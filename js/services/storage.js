const STORAGE_KEY = "koradevs_nihongo_stats_v1";

const DEFAULT_STATE = {
  score: 0,
  streak: 0,
  bestStreak: 0,
  total: 0
};

export class StorageService {
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
    } catch (err) {
      console.warn("Error al reiniciar storage:", err);
    }
    return { ...DEFAULT_STATE };
  }
}
