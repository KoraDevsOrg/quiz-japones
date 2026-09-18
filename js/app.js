import { WORDS_DATA } from "./data/words.js";
import { StorageService } from "./services/storage.js";
import { AudioService } from "./services/audio.js";
import { QuizModule } from "./modules/quiz.js";
import { WordSearchModule } from "./modules/wordsearch.js";
import { MemoryModule } from "./modules/memory.js";
import { ScrambleModule } from "./modules/scramble.js";

document.addEventListener("DOMContentLoaded", () => {
  // 1. Servicios y Estadísticas
  const audioService = new AudioService();
  const initialStats = StorageService.load();

  const scoreText = document.getElementById("scoreText");
  const streakText = document.getElementById("streakText");
  const headerStreakText = document.getElementById("headerStreakText");
  const bestStreakText = document.getElementById("bestStreakText");
  const vocabCount = document.getElementById("vocabCount");
  const btnResetStats = document.getElementById("btnResetStats");
  const currentSectionTitle = document.getElementById("currentSectionTitle");

  vocabCount.textContent = `${WORDS_DATA.length} 📚`;

  function renderStats(stats) {
    scoreText.textContent = stats.score;
    streakText.textContent = `${stats.streak} 🔥`;
    headerStreakText.textContent = `${stats.streak} 🔥`;
    bestStreakText.textContent = `${stats.bestStreak} 🏆`;
  }

  renderStats(initialStats);

  btnResetStats.addEventListener("click", () => {
    if (confirm("¿Deseas reiniciar tus estadísticas guardadas?")) {
      const freshStats = StorageService.reset();
      renderStats(freshStats);
      location.reload();
    }
  });

  // 2. Inicializar Módulos
  const quiz = new QuizModule(WORDS_DATA, StorageService, audioService, renderStats);
  const wordSearch = new WordSearchModule(WORDS_DATA, audioService);
  const memory = new MemoryModule(WORDS_DATA, audioService);
  const scramble = new ScrambleModule(WORDS_DATA, audioService);

  // 3. Configuración de Vistas
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
    }
  };

  // 4. Controlador del Menú Lateral (Drawer)
  const sideDrawer = document.getElementById("sideDrawer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const btnOpenDrawer = document.getElementById("btnOpenDrawer");
  const btnCloseDrawer = document.getElementById("btnCloseDrawer");
  const drawerItems = document.querySelectorAll(".drawer-item");

  function openDrawer() {
    sideDrawer.classList.add("open");
    drawerBackdrop.classList.add("active");
    sideDrawer.setAttribute("aria-hidden", "false");
  }

  function closeDrawer() {
    sideDrawer.classList.remove("open");
    drawerBackdrop.classList.remove("active");
    sideDrawer.setAttribute("aria-hidden", "true");
  }

  btnOpenDrawer.addEventListener("click", openDrawer);
  btnCloseDrawer.addEventListener("click", closeDrawer);
  drawerBackdrop.addEventListener("click", closeDrawer);

  function selectView(targetKey) {
    const view = views[targetKey];
    if (!view) return;

    // Ocultar todas las secciones y mostrar la seleccionada
    Object.values(views).forEach(v => {
      v.section.style.display = "none";
    });
    view.section.style.display = "block";

    // Actualizar título en la barra superior
    currentSectionTitle.textContent = view.title;

    // Actualizar clase activa en el menú
    drawerItems.forEach(item => {
      const isTarget = item.dataset.target === targetKey;
      item.classList.toggle("active", isTarget);
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
      
