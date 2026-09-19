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

  // Inicializar Módulo de Logros
  const achievements = new AchievementsModule(StorageService, audioService);

  // Verificador de logros al responder
  function handleStatsUpdate(stats) {
    if (scoreText) scoreText.textContent = stats.score;
    if (streakText) streakText.textContent = `${stats.streak} 🔥`;
    if (headerStreakText) headerStreakText.textContent = `${stats.streak} 🔥`;
    if (bestStreakText) bestStreakText.textContent = `${stats.bestStreak} 🏆`;

    // Evaluar logros de cuestionario
    if (stats.score >= 1) achievements.triggerUnlock("first_step");
    if (stats.streak >= 10) achievements.triggerUnlock("streak_10");
    if (stats.score >= 100) achievements.triggerUnlock("centurion");

    // Búho nocturno (después de las 8 PM)
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

  // Enganches (hooks) para logros de otros minijuegos
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

  // Logro de Sopa de Letras
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
});
