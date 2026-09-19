import { WORDS_DATA } from "./data/words.js";
import { StorageService } from "./services/storage.js";
import { AudioService } from "./services/audio.js";
import { QuizModule } from "./modules/quiz.js";
import { WordSearchModule } from "./modules/wordsearch.js";
import { MemoryModule } from "./modules/memory.js";
import { ScrambleModule } from "./modules/scramble.js";
import { TimeAttackModule } from "./modules/timeattack.js";

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

  function renderStats(stats) {
    if (scoreText) scoreText.textContent = stats.score;
    if (streakText) streakText.textContent = `${stats.streak} 🔥`;
    if (headerStreakText) headerStreakText.textContent = `${stats.streak} 🔥`;
    if (bestStreakText) bestStreakText.textContent = `${stats.bestStreak} 🏆`;
  }

  renderStats(initialStats);

  if (btnResetStats) {
    btnResetStats.addEventListener("click", () => {
      if (confirm("¿Deseas reiniciar tus estadísticas guardadas?")) {
        const freshStats = StorageService.reset();
        renderStats(freshStats);
        location.reload();
      }
    });
  }

  // Inicializar Módulos
  const quiz = new QuizModule(WORDS_DATA, StorageService, audioService, renderStats);
  const wordSearch = new WordSearchModule(WORDS_DATA, audioService);
  const memory = new MemoryModule(WORDS_DATA, audioService);
  const scramble = new ScrambleModule(WORDS_DATA, audioService);
  const timeAttack = new TimeAttackModule(WORDS_DATA, StorageService, audioService);

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

  // Arrancar con el cuestionario
  quiz.nextQuestion();
});
