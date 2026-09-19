export class TimeAttackModule {
  constructor(words, storageService, audioService) {
    this.words = words;
    this.storage = storageService;
    this.audio = audioService;

    this.duration = 60; // 60 segundos
    this.timeLeft = 60;
    this.timerId = null;
    this.currentQ = null;
    this.score = 0;
    this.mistakes = 0;
    this.isInputBlocked = false;

    // Elementos DOM
    this.lobbyView = document.getElementById("taLobby");
    this.gameView = document.getElementById("taGame");
    this.summaryView = document.getElementById("taSummary");

    this.btnStart = document.getElementById("btnTaStart");
    this.btnRetry = document.getElementById("btnTaRetry");
    this.bestScoreText = document.getElementById("taBestScoreText");

    this.secondsText = document.getElementById("taSeconds");
    this.currentScoreText = document.getElementById("taCurrentScore");
    this.progressFill = document.getElementById("taProgressFill");

    this.wordJpEl = document.getElementById("taWordJp");
    this.wordRomajiEl = document.getElementById("taWordRomaji");
    this.optionsContainer = document.getElementById("taOptions");

    this.finalScoreEl = document.getElementById("taFinalScore");
    this.finalMistakesEl = document.getElementById("taFinalMistakes");
    this.finalAccuracyEl = document.getElementById("taFinalAccuracy");
    this.newRecordMsg = document.getElementById("taNewRecordMsg");

    this._bindEvents();
    this.updateBestScoreUI();
  }

  _bindEvents() {
    this.btnStart.addEventListener("click", () => this.startGame());
    this.btnRetry.addEventListener("click", () => this.startGame());
  }

  updateBestScoreUI() {
    const best = this.storage.getTimeAttackBest();
    this.bestScoreText.textContent = best;
  }

  startGame() {
    this.score = 0;
    this.mistakes = 0;
    this.timeLeft = this.duration;
    this.isInputBlocked = false;

    this.currentScoreText.textContent = "0";
    this.secondsText.textContent = this.timeLeft;
    this.progressFill.style.width = "100%";
    this.progressFill.style.backgroundColor = "#22c55e";

    this.lobbyView.style.display = "none";
    this.summaryView.style.display = "none";
    this.gameView.style.display = "block";

    this.nextQuestion();
    this._startTimer();
  }

  _startTimer() {
    clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      this.timeLeft--;
      this.secondsText.textContent = this.timeLeft;

      // Actualizar ancho de la barra
      const percent = (this.timeLeft / this.duration) * 100;
      this.progressFill.style.width = `${percent}%`;

      // Cambio dinámico de color: Verde -> Amarillo -> Rojo
      if (percent < 25) {
        this.progressFill.style.backgroundColor = "#ef4444";
      } else if (percent < 50) {
        this.progressFill.style.backgroundColor = "#eab308";
      }

      if (this.timeLeft <= 0) {
        this._endGame();
      }
    }, 1000);
  }

  nextQuestion() {
    if (this.timeLeft <= 0) return;
    this.isInputBlocked = false;
    this.optionsContainer.innerHTML = "";

    // Palabra objetivo aleatoria
    const target = this.words[Math.floor(Math.random() * this.words.length)];

    // 3 distractores
    const distractors = [];
    while (distractors.length < 3) {
      const randMeaning = this.words[Math.floor(Math.random() * this.words.length)].meaning;
      if (randMeaning !== target.meaning && !distractors.includes(randMeaning)) {
        distractors.push(randMeaning);
      }
    }

    const options = [...distractors, target.meaning].sort(() => Math.random() - 0.5);

    this.currentQ = {
      target,
      correct: target.meaning,
      options
    };

    this.wordJpEl.textContent = target.kana;
    this.wordRomajiEl.textContent = target.romaji;

    // Renderizar opciones
    options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "ta-btn-opt";
      btn.textContent = opt;
      btn.addEventListener("click", () => this._handleAnswer(opt, btn));
      this.optionsContainer.appendChild(btn);
    });
  }

  _handleAnswer(selected, btnEl) {
    if (this.isInputBlocked || this.timeLeft <= 0) return;
    this.isInputBlocked = true;

    const isCorrect = selected === this.currentQ.correct;

    if (isCorrect) {
      this.score++;
      this.currentScoreText.textContent = this.score;
      btnEl.classList.add("flash-correct");
      this.audio.playFeedback(true);
    } else {
      this.mistakes++;
      btnEl.classList.add("flash-wrong");
      this.audio.playFeedback(false);
    }

    // Salto ultrarrápido a la siguiente palabra (120ms para percibir el color)
    setTimeout(() => {
      this.nextQuestion();
    }, 120);
  }

  _endGame() {
    clearInterval(this.timerId);
    this.gameView.style.display = "none";
    this.summaryView.style.display = "block";

    const totalAnswered = this.score + this.mistakes;
    const accuracy = totalAnswered > 0 ? Math.round((this.score / totalAnswered) * 100) : 0;

    this.finalScoreEl.textContent = this.score;
    this.finalMistakesEl.textContent = this.mistakes;
    this.finalAccuracyEl.textContent = `${accuracy}%`;

    // Comprobar si superó su récord
    const isNewRecord = this.storage.setTimeAttackBest(this.score);
    if (isNewRecord && this.score > 0) {
      this.newRecordMsg.style.display = "block";
      this.audio.speakJapanese("おめでとうございます"); // "¡Felicidades!" en japonés
    } else {
      this.newRecordMsg.style.display = "none";
    }

    this.updateBestScoreUI();
  }

  // Al abrir la vista desde el menú, resetear al lobby
  resetToLobby() {
    clearInterval(this.timerId);
    this.gameView.style.display = "none";
    this.summaryView.style.display = "none";
    this.lobbyView.style.display = "block";
    this.updateBestScoreUI();
  }
}
