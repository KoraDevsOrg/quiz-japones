import { WORDS_DATA } from "./data/words.js";
import { PHRASES_DATA } from "./data/phrases.js";
import { StorageService } from "./services/storage.js";
import { AudioService } from "./services/audio.js";
import { QuizModule } from "./modules/quiz.js";
import { WordSearchModule } from "./modules/wordsearch.js";
import { MemoryModule } from "./modules/memory.js";
import { ScrambleModule } from "./modules/scramble.js";
import { TimeAttackModule } from "./modules/timeattack.js";
import { AchievementsModule } from "./modules/achievements.js";
import { SpeakingModule } from "./modules/speaking.js";

document.addEventListener("DOMContentLoaded", async () => {
  const audioService = new AudioService();
  const initialStats = StorageService.load();

  // Desbloqueo de Audio para WebView Android
  const unlockAudio = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.resume();
    }
  };
  document.body.addEventListener("click", unlockAudio, { once: true });
  document.body.addEventListener("touchstart", unlockAudio, { once: true });

  const scoreText = document.getElementById("scoreText");
  const streakText = document.getElementById("streakText");
  const headerStreakText = document.getElementById("headerStreakText");
  const bestStreakText = document.getElementById("bestStreakText");
  const vocabCount = document.getElementById("vocabCount");
  const btnResetStats = document.getElementById("btnResetStats");
  const currentSectionTitle = document.getElementById("currentSectionTitle");

  // ========================================================
  // PERSISTENCIA FORZADA Y LIMPIEZA EN KORA ADMIN DB
  // ========================================================
  let activeWords = [...WORDS_DATA];
  let activePhrases = [...PHRASES_DATA];

  if (typeof window.KoraDB !== "undefined") {
    try {
      // 1. Validar conteo actual en SQLite
      const countCheck = window.KoraDB.query("SELECT COUNT(*) AS total FROM mod_jp_palabras;", "[]");
      let currentTotal = 0;
      try {
        const parsed = JSON.parse(countCheck);
        currentTotal = parsed.length > 0 ? Number(parsed[0].total) : 0;
      } catch (e) {
        currentTotal = 0;
      }

      // Si tiene los 44 registros de prueba o está desactualizada, purgar de raíz
      if (currentTotal === 44 || currentTotal < WORDS_DATA.length) {
        console.log("[KoraDB] Purgando tabla antigua con registros residuales...");
        window.KoraDB.execute("DROP TABLE IF EXISTS mod_jp_palabras;", "[]");
      }

      // 2. Recrear tabla de palabras con esquema estándar
      const ddlPalabras = `
        CREATE TABLE IF NOT EXISTS mod_jp_palabras (
          id TEXT PRIMARY KEY,
          kana TEXT,
          romaji TEXT,
          kanji TEXT,
          meaning TEXT,
          cat TEXT
        );
      `;
      window.KoraDB.execute(ddlPalabras, "[]");

      // 3. Recrear tabla de frases situacionales
      const ddlFrases = `
        CREATE TABLE IF NOT EXISTS mod_jp_frases (
          id TEXT PRIMARY KEY,
          situation TEXT,
          jp TEXT,
          kana TEXT,
          romaji TEXT,
          meaning TEXT,
          pattern TEXT,
          pitch TEXT
        );
      `;
      window.KoraDB.execute(ddlFrases, "[]");

      // 4. Volcar las 130 palabras limpias si la tabla quedó en 0
      const postCheck = JSON.parse(window.KoraDB.query("SELECT COUNT(*) AS total FROM mod_jp_palabras;", "[]"));
      const finalWordsCount = postCheck.length > 0 ? Number(postCheck[0].total) : 0;

      if (finalWordsCount === 0) {
        WORDS_DATA.forEach(item => {
          const sql = `
            INSERT OR REPLACE INTO mod_jp_palabras (id, kana, romaji, kanji, meaning, cat)
            VALUES (?, ?, ?, ?, ?, ?);
          `;
          const id = `${item.kana}_${item.romaji}`;
          window.KoraDB.execute(sql, JSON.stringify([
            id,
            item.kana || "",
            item.romaji || "",
            item.kanji || "",
            item.meaning || "",
            item.cat || ""
          ]));
        });
      }

      // 5. Volcar frases
      const postPhrases = JSON.parse(window.KoraDB.query("SELECT COUNT(*) AS total FROM mod_jp_frases;", "[]"));
      if (postPhrases.length === 0 || Number(postPhrases[0].total) === 0) {
        PHRASES_DATA.forEach(p => {
          const sql = `
            INSERT OR REPLACE INTO mod_jp_frases (id, situation, jp, kana, romaji, meaning, pattern, pitch)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
          `;
          window.KoraDB.execute(sql, JSON.stringify([
            p.id,
            p.situation || "",
            p.jp || "",
            p.kana || "",
            p.romaji || "",
            p.meaning || "",
            p.pattern || "",
            p.pitch || ""
          ]));
        });
      }

      // 6. Leer los datos garantizados desde SQLite
      const dbWords = JSON.parse(window.KoraDB.query("SELECT * FROM mod_jp_palabras;", "[]"));
      if (dbWords && dbWords.length > 0) activeWords = dbWords;

      const dbPhrases = JSON.parse(window.KoraDB.query("SELECT * FROM mod_jp_frases;", "[]"));
      if (dbPhrases && dbPhrases.length > 0) activePhrases = dbPhrases;

    } catch (err) {
      console.error("[KoraDB] Error en inicialización:", err);
    }
  }

  if (vocabCount) vocabCount.textContent = `${activeWords.length} 📚`;

  // Módulo de Logros
  const achievements = new AchievementsModule(StorageService, audioService);
  const speaking = new SpeakingModule(activePhrases, audioService, achievements);

  function handleStatsUpdate(stats) {
    if (scoreText) scoreText.textContent = stats.score;
    if (streakText) streakText.textContent = `${stats.streak} 🔥`;
    if (headerStreakText) headerStreakText.textContent = `${stats.streak} 🔥`;
    if (bestStreakText) bestStreakText.textContent = `${stats.bestStreak} 🏆`;

    if (stats.score >= 1) achievements.triggerUnlock("first_step");
    if (stats.streak >= 10) achievements.triggerUnlock("streak_10");
    if (stats.score >= 100) achievements.triggerUnlock("centurion");

    const currentHour = new Date().getHours();
    if (currentHour >= 20 || currentHour < 5) achievements.triggerUnlock("night_owl");
  }

  handleStatsUpdate(initialStats);

  if (btnResetStats) {
    btnResetStats.addEventListener("click", () => {
      if (confirm("¿Deseas reiniciar tus estadísticas y medallas guardadas?")) {
        const freshStats = StorageService.reset();
        handleStatsUpdate(freshStats);
        location.reload();
      }
    });
  }

  // Inicializar módulos de juego
  const quiz = new QuizModule(activeWords, StorageService, audioService, handleStatsUpdate);
  const wordSearch = new WordSearchModule(activeWords, audioService);
  const memory = new MemoryModule(activeWords, audioService);
  const scramble = new ScrambleModule(activeWords, audioService);
  const timeAttack = new TimeAttackModule(activeWords, StorageService, audioService);

  // Hooks de logros
  const originalEndGame = timeAttack._endGame.bind(timeAttack);
  timeAttack._endGame = function () {
    originalEndGame();
    if (this.score >= 10) achievements.triggerUnlock("speed_ninja");
  };

  const originalDisableCards = memory._disableCards.bind(memory);
  memory._disableCards = function () {
    originalDisableCards();
    if (this.matchedPairs === 6 && this.moves <= 8) achievements.triggerUnlock("memory_master");
  };

  const originalCheckWord = scramble._checkWord.bind(scramble);
  scramble._checkWord = function () {
    originalCheckWord();
    if (this.streak >= 5) achievements.triggerUnlock("scramble_master");
  };

  const originalHandleCellClick = wordSearch._handleCellClick.bind(wordSearch);
  wordSearch._handleCellClick = function (cell) {
    originalHandleCellClick(cell);
    if (this.foundWords.length === this.activeWords.length && this.activeWords.length > 0) {
      achievements.triggerUnlock("wordsearch_master");
    }
  };

  // ==========================================
  // VISTAS DE PRÁCTICA ORAL Y SHADOWING
  // ==========================================
  let currentPhraseIdx = 0;
  const spkSituation = document.getElementById("spkSituation");
  const spkJp = document.getElementById("spkJp");
  const spkKana = document.getElementById("spkKana");
  const spkPitch = document.getElementById("spkPitch");
  const spkMeaning = document.getElementById("spkMeaning");
  const spkFeedback = document.getElementById("spkFeedback");
  const btnSpkListen = document.getElementById("btnSpkListen");
  const btnSpkMic = document.getElementById("btnSpkMic");
  const btnSpkPrev = document.getElementById("btnSpkPrev");
  const btnSpkNext = document.getElementById("btnSpkNext");

  function safeSpeak(text) {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "ja-JP";
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    }
  }

  function renderSpeakingPhrase() {
    const item = activePhrases[currentPhraseIdx];
    if (!item || !spkJp) return;
    spkSituation.textContent = item.situation;
    spkJp.textContent = item.jp;
    spkKana.textContent = item.kana;
    spkPitch.textContent = `Acento: ${item.pitch} | Patrón: ${item.pattern}`;
    spkMeaning.textContent = item.meaning;
    spkFeedback.textContent = "";
  }

  if (btnSpkListen) {
    btnSpkListen.addEventListener("click", () => {
      safeSpeak(activePhrases[currentPhraseIdx].jp);
    });
  }

  if (btnSpkMic) {
    btnSpkMic.addEventListener("click", () => {
      if (!speaking.hasSpeech) {
        spkFeedback.style.color = "#f59e0b";
        spkFeedback.textContent = "El visor local no tiene micrófono nativo activado. Abre la web en Chrome para dictar por voz.";
        safeSpeak(activePhrases[currentPhraseIdx].jp);
        return;
      }

      speaking.startListening(activePhrases[currentPhraseIdx], (res) => {
        if (res.status === "listening") {
          spkFeedback.style.color = "#38bdf8";
          spkFeedback.textContent = res.msg;
        } else if (res.success) {
          spkFeedback.style.color = "#22c55e";
          spkFeedback.textContent = res.msg;
        } else {
          spkFeedback.style.color = "#ef4444";
          spkFeedback.textContent = res.msg;
        }
      });
    });
  }

  if (btnSpkNext) {
    btnSpkNext.addEventListener("click", () => {
      currentPhraseIdx = (currentPhraseIdx + 1) % activePhrases.length;
      renderSpeakingPhrase();
    });
  }

  if (btnSpkPrev) {
    btnSpkPrev.addEventListener("click", () => {
      currentPhraseIdx = (currentPhraseIdx - 1 + activePhrases.length) % activePhrases.length;
      renderSpeakingPhrase();
    });
  }

  // Shadowing & Manos Libres
  const shdJp = document.getElementById("shdJp");
  const shdMeaning = document.getElementById("shdMeaning");
  const shdStatus = document.getElementById("shdStatus");
  const btnToggleHandsFree = document.getElementById("btnToggleHandsFree");

  if (btnToggleHandsFree) {
    btnToggleHandsFree.addEventListener("click", () => {
      if (speaking.isHandsFreeActive) {
        speaking.stopHandsFree();
        btnToggleHandsFree.textContent = "▶ Iniciar Manos Libres";
        btnToggleHandsFree.style.background = "#22c55e";
        if (shdStatus) shdStatus.textContent = "En pausa";
      } else {
        btnToggleHandsFree.textContent = "⏹ Detener";
        btnToggleHandsFree.style.background = "#ef4444";
        speaking.startHandsFree(null, (item, stepText) => {
          if (shdJp) shdJp.textContent = item.jp;
          if (shdMeaning) shdMeaning.textContent = item.meaning;
          if (shdStatus) shdStatus.textContent = stepText;
        });
      }
    });
  }

  // Menú y Navegación
  const views = {
    quiz: {
      title: "Cuestionario",
      section: document.getElementById("quizSection"),
      onOpen: null
    },
    speaking: {
      title: "Práctica Oral & Voz",
      section: document.getElementById("speakingSection"),
      onOpen: () => renderSpeakingPhrase()
    },
    shadowing: {
      title: "Shadowing (Manos Libres)",
      section: document.getElementById("shadowingSection"),
      onOpen: null
    },
    wordsearch: {
      title: "Sopa de Letras",
      section: document.getElementById("wsSection"),
      onOpen: () => wordSearch.generate()
    },
    memory: {
      title: "Parejas de Memoria",
      section: document.getElementById("memorySection"),
      onOpen: () => memory.startNewGame()
    },
    scramble: {
      title: "Anagrama",
      section: document.getElementById("scrambleSection"),
      onOpen: () => scramble.nextWord()
    },
    timeattack: {
      title: "Contrarreloj (60s)",
      section: document.getElementById("timeAttackSection"),
      onOpen: () => timeAttack.resetToLobby()
    },
    achievements: {
      title: "Medallas y Logros",
      section: document.getElementById("achievementsSection"),
      onOpen: () => achievements.render()
    }
  };

  const sideDrawer = document.getElementById("sideDrawer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const btnOpenDrawer = document.getElementById("btnOpenDrawer");
  const btnCloseDrawer = document.getElementById("btnCloseDrawer");
  const drawerItems = document.querySelectorAll(".drawer-item");

  function openDrawer() {
    if (!sideDrawer || !drawerBackdrop) return;
    sideDrawer.classList.add("open");
    drawerBackdrop.classList.add("active");
  }

  function closeDrawer() {
    if (!sideDrawer || !drawerBackdrop) return;
    sideDrawer.classList.remove("open");
    drawerBackdrop.classList.remove("active");
  }

  if (btnOpenDrawer) btnOpenDrawer.addEventListener("click", openDrawer);
  if (btnCloseDrawer) btnCloseDrawer.addEventListener("click", closeDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener("click", closeDrawer);

  function selectView(targetKey) {
    const view = views[targetKey];
    if (!view || !view.section) return;

    if (targetKey !== "shadowing" && speaking.isHandsFreeActive) {
      speaking.stopHandsFree();
      if (btnToggleHandsFree) {
        btnToggleHandsFree.textContent = "▶ Iniciar Manos Libres";
        btnToggleHandsFree.style.background = "#22c55e";
      }
    }

    Object.values(views).forEach(v => {
      if (v.section) v.section.style.display = "none";
    });
    view.section.style.display = "block";

    if (currentSectionTitle) currentSectionTitle.textContent = view.title;

    drawerItems.forEach(item => {
      item.classList.toggle("active", item.dataset.target === targetKey);
    });

    closeDrawer();
    if (view.onOpen) view.onOpen();
  }

  drawerItems.forEach(item => {
    item.addEventListener("click", () => {
      selectView(item.dataset.target);
    });
  });

  quiz.nextQuestion();

  // Silabario Hiragana
  const hiraganaTable = [
    { k: "あ", r: "a" },  { k: "い", r: "i" },   { k: "う", r: "u" },   { k: "え", r: "e" },  { k: "お", r: "o" },
    { k: "か", r: "ka" }, { k: "き", r: "ki" },  { k: "く", r: "ku" },  { k: "け", r: "ke" }, { k: "こ", r: "ko" },
    { k: "さ", r: "sa" }, { k: "し", r: "shi" }, { k: "す", r: "su" },  { k: "せ", r: "se" }, { k: "そ", r: "so" },
    { k: "た", r: "ta" }, { k: "ち", r: "chi" }, { k: "つ", r: "tsu" }, { k: "て", r: "te" }, { k: "と", r: "to" },
    { k: "な", r: "na" }, { k: "ni", r: "ni" },  { k: "ぬ", r: "nu" },  { k: "ね", r: "ne" }, { k: "の", r: "no" },
    { k: "は", r: "ha" }, { k: "ひ", r: "hi" },  { k: "ふ", r: "fu" },  { k: "へ", r: "he" }, { k: "ほ", r: "ho" },
    { k: "ま", r: "ma" }, { k: "み", r: "mi" },  { k: "む", r: "mu" },  { k: "め", r: "me" }, { k: "も", r: "mo" },
    { k: "や", r: "ya" }, { k: "", r: "" },      { k: "ゆ", r: "yu" },  { k: "", r: "" },     { k: "よ", r: "yo" },
    { k: "ら", r: "ra" }, { k: "り", r: "ri" },  { k: "る", r: "ru" },  { k: "れ", r: "re" }, { k: "ろ", r: "ro" },
    { k: "わ", r: "wa" }, { k: "", r: "" },      { k: "を", r: "wo" },  { k: "", r: "" },     { k: "ん", r: "n" }
  ];

  const hiraganaGrid = document.getElementById("hiraganaGrid");
  const hiraganaModal = document.getElementById("hiraganaModal");
  const hiraganaBackdrop = document.getElementById("hiraganaModalBackdrop");
  const btnOpenHiragana = document.getElementById("btnOpenHiraganaModal");
  const btnCloseHiragana = document.getElementById("btnCloseHiraganaModal");

  if (hiraganaGrid) {
    hiraganaTable.forEach(item => {
      const card = document.createElement("div");
      if (!item.k) {
        card.className = "kana-card empty";
      } else {
        card.className = "kana-card";
        card.innerHTML = `<span class="kana-char">${item.k}</span><span class="kana-romaji">${item.r}</span>`;
        card.addEventListener("click", () => safeSpeak(item.k));
      }
      hiraganaGrid.appendChild(card);
    });
  }

  function openHiraganaModal() {
    if (!hiraganaModal || !hiraganaBackdrop) return;
    hiraganaModal.classList.add("show");
    hiraganaBackdrop.classList.add("show");
  }

  function closeHiraganaModal() {
    if (!hiraganaModal || !hiraganaBackdrop) return;
    hiraganaModal.classList.remove("show");
    hiraganaBackdrop.classList.remove("show");
  }

  if (btnOpenHiragana) btnOpenHiragana.addEventListener("click", openHiraganaModal);
  if (btnCloseHiragana) btnCloseHiragana.addEventListener("click", closeHiraganaModal);
  if (hiraganaBackdrop) hiraganaBackdrop.addEventListener("click", closeHiraganaModal);
});
