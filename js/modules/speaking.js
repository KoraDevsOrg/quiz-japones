/**
 * Motor de Práctica Oral, Shadowing y Repetición Espaciada (SM-2)
 * Persistencia híbrida en Kora Admin DB (SQLite) y Web Storage.
 */
export class SpeakingModule {
  constructor(phrases, audioService, achievements) {
    this.phrases = phrases;
    this.audioService = audioService;
    this.achievements = achievements;

    this.currentIndex = 0;
    this.isListening = false;
    this.isHandsFreeActive = false;
    this.handsFreeTimer = null;

    // Inicializar soporte de reconocimiento de voz
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.hasSpeech = !!SpeechRecognition;
    if (this.hasSpeech) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = "ja-JP";
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 3;
    }

    this.initSrsTable();
  }

  // 1. Inicialización de tabla SQLite mod_jp_srs en Kora Admin DB
  initSrsTable() {
    if (typeof window.KoraDB !== "undefined") {
      const ddl = `
        CREATE TABLE IF NOT EXISTS mod_jp_srs (
          id TEXT PRIMARY KEY,
          interval_days INTEGER,
          repetitions INTEGER,
          ease_factor REAL,
          next_review INTEGER
        );
      `;
      window.KoraDB.execute(ddl, "[]");
    }
  }

  // 2. Algoritmo SM-2 (Repetición Espaciada)
  getSrsData(id) {
    if (typeof window.KoraDB !== "undefined") {
      try {
        const rows = JSON.parse(window.KoraDB.query(
          "SELECT * FROM mod_jp_srs WHERE id = ?",
          JSON.stringify([id])
        ));
        if (rows.length > 0) return rows[0];
      } catch (e) {
        console.warn("Fallo lectura SRS KoraDB:", e);
      }
    }
    const local = localStorage.getItem(`srs_${id}`);
    return local ? JSON.parse(local) : { interval_days: 1, repetitions: 0, ease_factor: 2.5, next_review: 0 };
  }

  saveSrsProgress(id, quality) {
    let { interval_days, repetitions, ease_factor } = this.getSrsData(id);

    if (quality >= 3) {
      if (repetitions === 0) interval_days = 1;
      else if (repetitions === 1) interval_days = 6;
      else interval_days = Math.round(interval_days * ease_factor);
      repetitions += 1;
    } else {
      repetitions = 0;
      interval_days = 1;
    }

    ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (ease_factor < 1.3) ease_factor = 1.3;

    const next_review = Date.now() + interval_days * 86400000;

    if (typeof window.KoraDB !== "undefined") {
      const sql = `
        INSERT OR REPLACE INTO mod_jp_srs (id, interval_days, repetitions, ease_factor, next_review)
        VALUES (?, ?, ?, ?, ?);
      `;
      window.KoraDB.execute(sql, JSON.stringify([id, interval_days, repetitions, ease_factor, next_review]));
    }
    localStorage.setItem(`srs_${id}`, JSON.stringify({ interval_days, repetitions, ease_factor, next_review }));
  }

  // 3. Reconocimiento de Voz Fonético
  startListening(targetPhrase, onResult) {
    if (!this.hasSpeech) {
      onResult({ success: false, msg: "Tu navegador no soporta reconocimiento de voz en japonés." });
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      return;
    }

    this.isListening = true;
    onResult({ status: "listening", msg: "Escuchando... habla en japonés" });

    this.recognition.onresult = (event) => {
      this.isListening = false;
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      const cleanKana = targetPhrase.kana.replace(/\s+/g, "");
      const cleanJp = targetPhrase.jp.replace(/\s+/g, "");

      const isMatch = transcript.includes(cleanKana) || transcript.includes(cleanJp) ||
                      cleanKana.includes(transcript) || cleanJp.includes(transcript);

      if (isMatch) {
        this.saveSrsProgress(targetPhrase.id, 5);
        if (this.achievements) this.achievements.triggerUnlock("first_step");
        onResult({ success: true, recognized: transcript, msg: "¡Pronunciación excelente!" });
      } else {
        this.saveSrsProgress(targetPhrase.id, 2);
        onResult({ success: false, recognized: transcript, msg: `Detectado: "${transcript}". Intenta de nuevo.` });
      }
    };

    this.recognition.onerror = (e) => {
      this.isListening = false;
      onResult({ success: false, msg: `Error en micrófono: ${e.error}` });
    };

    this.recognition.start();
  }

  // 4. Modo Shadowing y Manos Libres
  playShadowing(phrase, rate = 1.0, onStep) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(phrase.jp);
    utter.lang = "ja-JP";
    utter.rate = rate;

    utter.onstart = () => {
      if (onStep) onStep(`Escuchando a ${rate}x...`);
    };

    utter.onend = () => {
      if (onStep) onStep("Ahora repite en voz alta...");
    };

    window.speechSynthesis.speak(utter);
  }

  startHandsFree(container, onUpdate) {
    this.isHandsFreeActive = true;
    let idx = 0;

    const step = () => {
      if (!this.isHandsFreeActive) return;
      const item = this.phrases[idx % this.phrases.length];
      onUpdate(item, "Escucha lenta (0.8x)");

      this.playShadowing(item, 0.8, () => {});

      this.handsFreeTimer = setTimeout(() => {
        if (!this.isHandsFreeActive) return;
        onUpdate(item, "Escucha normal (1.0x)");
        this.playShadowing(item, 1.0, () => {});

        this.handsFreeTimer = setTimeout(() => {
          idx++;
          step();
        }, 4500);
      }, 4000);
    };

    step();
  }

  stopHandsFree() {
    this.isHandsFreeActive = false;
    clearTimeout(this.handsFreeTimer);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }
}
