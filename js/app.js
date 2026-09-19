import { WORDS_DATA } from "./data/words.js";
import { StorageService } from "./services/storage.js";
import { AudioService } from "./services/audio.js";
import { QuizModule } from "./modules/quiz.js";
import { WordSearchModule } from "./modules/wordsearch.js";
import { MemoryModule } from "./modules/memory.js";
import { ScrambleModule } from "./modules/scramble.js";
import { TimeAttackModule } from "./modules/timeattack.js";
import { AchievementsModule } from "./modules/achievements.js";

document.addEventListener("DOMContentLoaded", () => {
  const audioService = new AudioService();
  const initialStats = StorageService.load();

  const scoreText = document.getElementById("scoreText");
  const streakText = document.getElementById("streakText");
  const headerStreakText = document.getElementById("headerStreakText");
  const bestStreakText = document.getElementById("bestStreakText");
  const vocabCount = document.getElementById("vocabCount");
  const btnResetStats = document.getElementById("btnResetStats");
  const currentSectionTitle = document.getElementById("currentSectionTitle");

  if (vocabCount) vocabCount.textContent = `${WORDS_DATA.length} 📚`;

  // Módulo de Logros
  const achievements = new AchievementsModule(StorageService, audioService);

  function handleStatsUpdate(stats) {
    if (scoreText) scoreText.textContent = stats.score;
    if (streakText) streakText.textContent = `${stats.streak} 🔥`;
    if (headerStreakText) headerStreakText.textContent = `${stats.streak} 🔥`;
    if (bestStreakText) bestStreakText.textContent = `${stats.bestStreak} 🏆`;

    if (stats.score >= 1) achievements.triggerUnlock("first_step");
    if (stats.streak >= 10) achievements.triggerUnlock("streak_10");
    if (stats.score >= 100) achievements.triggerUnlock("centurion");

    const currentHour = new Date().getHours();
    if (currentHour >= 20 || currentHour < 5) {
      achievements.triggerUnlock("night_owl");
    }
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

  // Inicializar módulos
  const quiz = new QuizModule(WORDS_DATA, StorageService, audioService, handleStatsUpdate);
  const wordSearch = new WordSearchModule(WORDS_DATA, audioService);
  const memory = new MemoryModule(WORDS_DATA, audioService);
  const scramble = new ScrambleModule(WORDS_DATA, audioService);
  const timeAttack = new TimeAttackModule(WORDS_DATA, StorageService, audioService);

  // Hooks para logros
  const originalEndGame = timeAttack._endGame.bind(timeAttack);
  timeAttack._endGame = function () {
    originalEndGame();
    if (this.score >= 10) achievements.triggerUnlock("speed_ninja");
  };

  const originalDisableCards = memory._disableCards.bind(memory);
  memory._disableCards = function () {
    originalDisableCards();
    if (this.matchedPairs === 6 && this.moves <= 8) {
      achievements.triggerUnlock("memory_master");
    }
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

  // Vistas disponibles
  const views = {
    quiz: {
      title: "Cuestionario",
      section: document.getElementById("quizSection"),
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

  // Controlador Drawer
  const sideDrawer = document.getElementById("sideDrawer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const btnOpenDrawer = document.getElementById("btnOpenDrawer");
  const btnCloseDrawer = document.getElementById("btnCloseDrawer");
  const drawerItems = document.querySelectorAll(".drawer-item");

  function openDrawer() {
    if (!sideDrawer || !drawerBackdrop) return;
    sideDrawer.classList.add("open");
    drawerBackdrop.classList.add("active");
    sideDrawer.setAttribute("aria-hidden", "false");
  }

  function closeDrawer() {
    if (!sideDrawer || !drawerBackdrop) return;
    sideDrawer.classList.remove("open");
    drawerBackdrop.classList.remove("active");
    sideDrawer.setAttribute("aria-hidden", "true");
  }

  if (btnOpenDrawer) btnOpenDrawer.addEventListener("click", openDrawer);
  if (btnCloseDrawer) btnCloseDrawer.addEventListener("click", closeDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener("click", closeDrawer);

  function selectView(targetKey) {
    const view = views[targetKey];
    if (!view || !view.section) return;

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

  // ==========================================
  // SILABARIO HIRAGANA INTERACTIVO (Gojūon)
  // ==========================================
  const hiraganaTable = [
    { k: "あ", r: "a" },  { k: "い", r: "i" },   { k: "う", r: "u" },   { k: "え", r: "e" },  { k: "お", r: "o" },
    { k: "か", r: "ka" }, { k: "き", r: "ki" },  { k: "く", r: "ku" },  { k: "け", r: "ke" }, { k: "こ", r: "ko" },
    { k: "さ", r: "sa" }, { k: "し", r: "shi" }, { k: "す", r: "su" },  { k: "せ", r: "se" }, { k: "そ", r: "so" },
    { k: "た", r: "ta" }, { k: "ち", r: "chi" }, { k: "つ", r: "tsu" }, { k: "て", r: "te" }, { k: "と", r: "to" },
    { k: "な", r: "na" }, { k: "に", r: "ni" },  { k: "ぬ", r: "nu" },  { k: "ね", r: "ne" }, { k: "の", r: "no" },
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
        card.addEventListener("click", () => {
          audioService.speakJapanese(item.k);
        });
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

  // ==========================================
  // REGISTRO DE SERVICE WORKER (PWA)
  // ==========================================
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(err => {
      console.warn("Fallo al registrar Service Worker:", err);
    });
  }
});
