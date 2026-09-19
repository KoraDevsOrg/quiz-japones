const STORAGE_KEY = "koradevs_nihongo_stats_v1";
const MISTAKES_KEY = "koradevs_nihongo_mistakes_v1";
const TIMEATTACK_KEY = "koradevs_nihongo_timeattack_best_v1";

const DEFAULT_STATE = {
  score: 0,
  streak: 0,
  bestStreak: 0,
  total: 0
};

export class StorageService {
  // Estadísticas del Quiz
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
      console.warn("No se pudo guardar en storage:", err);
    }
  }

  static reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(MISTAKES_KEY);
      localStorage.removeItem(TIMEATTACK_KEY);
    } catch (err) {
      console.warn("Error al reiniciar:", err);
    }
    return { ...DEFAULT_STATE };
  }

  // Repaso de Errores
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
      return [];
    }
  }

  // Récord Contrarreloj (Time Attack)
  static getTimeAttackBest() {
    try {
      return parseInt(localStorage.getItem(TIMEATTACK_KEY), 10) || 0;
    } catch {
      return 0;
    }
  }

  static setTimeAttackBest(score) {
    try {
      const current = this.getTimeAttackBest();
      if (score > current) {
        localStorage.setItem(TIMEATTACK_KEY, score.toString());
        return true; // Nuevo récord alcanzado
      }
      return false;
    } catch {
      return false;
    }
  }
}
