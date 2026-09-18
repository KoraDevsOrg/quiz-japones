import { WORDS_DATA } from "./data/words.js";
import { StorageService } from "./services/storage.js";
import { AudioService } from "./services/audio.js";
import { QuizModule } from "./modules/quiz.js";
import { WordSearchModule } from "./modules/wordsearch.js";

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
    }
  });

  // 3. Inicializar Módulos
  const quiz = new QuizModule(WORDS_DATA, StorageService, audioService, renderStats);
  const wordSearch = new WordSearchModule(WORDS_DATA, audioService);

  // 4. Gestión de Pestañas
  const tabQuiz = document.getElementById("tabQuiz");
  const tabWordSearch = document.getElementById("tabWordSearch");
  const quizSection = document.getElementById("quizSection");
  const wsSection = document.getElementById("wsSection");

  tabQuiz.addEventListener("click", () => {
    quizSection.style.display = "block";
    wsSection.style.display = "none";
    tabQuiz.classList.add("active");
    tabWordSearch.classList.remove("active");
    tabQuiz.setAttribute("aria-selected", "true");
    tabWordSearch.setAttribute("aria-selected", "false");
  });

  tabWordSearch.addEventListener("click", () => {
    quizSection.style.display = "none";
    wsSection.style.display = "block";
    tabQuiz.classList.remove("active");
    tabWordSearch.classList.add("active");
    tabQuiz.setAttribute("aria-selected", "false");
    tabWordSearch.setAttribute("aria-selected", "true");
    wordSearch.generate();
  });

  // Arrancar primera pregunta
  quiz.nextQuestion();
});
