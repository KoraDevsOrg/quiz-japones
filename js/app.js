import { WORDS_DATA } from "./data/words.js";
import { StorageService } from "./services/storage.js";
import { AudioService } from "./services/audio.js";
import { QuizModule } from "./modules/quiz.js";
import { WordSearchModule } from "./modules/wordsearch.js";
import { MemoryModule } from "./modules/memory.js";
import { ScrambleModule } from "./modules/scramble.js";

document.addEventListener("DOMContentLoaded", () => {
  // 1. Inicializar Servicios
  const audioService = new AudioService();
  const initialStats = StorageService.load();

  // 2. Elementos DOM de estadísticas
  const scoreText = document.getElementById("scoreText");
  const streakText = document.getElementById("streakText");
  const bestStreakText = document.getElementById("bestStreakText");
  const vocabCount = document.getElementById("vocabCount");
  const btnResetStats = document.getElementById("btnResetStats");

  vocabCount.textContent = `${WORDS_DATA.length} 📚`;

  function renderStats(stats) {
    scoreText.textContent = stats.score;
    streakText.textContent = `${stats.streak} 🔥`;
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

  // 3. Inicializar Módulos
  const quiz = new QuizModule(WORDS_DATA, StorageService, audioService, renderStats);
  const wordSearch = new WordSearchModule(WORDS_DATA, audioService);
  const memory = new MemoryModule(WORDS_DATA, audioService);
  const scramble = new ScrambleModule(WORDS_DATA, audioService);

  // 4. Gestión Centralizada de Pestañas
  const tabs = [
    { btn: document.getElementById("tabQuiz"), section: document.getElementById("quizSection"), onActive: null },
    { btn: document.getElementById("tabWordSearch"), section: document.getElementById("wsSection"), onActive: () => wordSearch.generate() },
    { btn: document.getElementById("tabMemory"), section: document.getElementById("memorySection"), onActive: () => memory.startNewGame() },
    { btn: document.getElementById("tabScramble"), section: document.getElementById("scrambleSection"), onActive: () => scramble.nextWord() }
  ];

  function setActiveTab(activeTab) {
    tabs.forEach(tab => {
      const isActive = tab.btn === activeTab.btn;
      tab.btn.classList.toggle("active", isActive);
      tab.btn.setAttribute("aria-selected", isActive);
      tab.section.style.display = isActive ? "block" : "none";
    });

    if (activeTab.onActive) activeTab.onActive();
  }

  tabs.forEach(tab => {
    tab.btn.addEventListener("click", () => setActiveTab(tab));
  });

  // Iniciar con la primera pregunta del Quiz
  quiz.nextQuestion();
});
