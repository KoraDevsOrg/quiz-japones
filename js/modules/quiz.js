export class QuizModule {
  constructor(words, storageService, audioService, onStatsUpdate) {
    this.allWords = words;
    this.filteredWords = [...words];
    this.storage = storageService;
    this.audio = audioService;
    this.onStatsUpdate = onStatsUpdate;

    this.currentQ = null;
    this.answered = false;
    this.isReviewMode = false;

    // Preferencias
    this.showRomaji = localStorage.getItem("koradevs_show_romaji") !== "false";
    this.quizMode = localStorage.getItem("koradevs_quiz_mode") || "jp-es";

    // Elementos DOM
    this.questionTitleContainer = document.getElementById("questionTitleContainer");
    this.romajiStatus = document.getElementById("romajiStatus");
    this.btnToggleRomaji = document.getElementById("btnToggleRomaji");
    this.categorySelect = document.getElementById("categorySelect");
    this.modeSelect = document.getElementById("modeSelect");
    this.btnReviewMistakes = document.getElementById("btnReviewMistakes");
    this.mistakesCount = document.getElementById("mistakesCount");
    this.reviewBanner = document.getElementById("reviewBanner");

    this.optionsContainer = document.getElementById("optionsContainer");
    this.expBox = document.getElementById("explanationBox");
    this.expStatus = document.getElementById("expStatus");
    this.expBody = document.getElementById("expBody");
    this.nextBtn = document.getElementById("nextBtn");
    this.audioBtn = document.getElementById("btnPlayAudio");

    this.modeSelect.value = this.quizMode;
    this._updateRomajiUI();
    this._updateMistakesCountUI();
    this._bindEvents();
  }

  _bindEvents() {
    this.nextBtn.addEventListener("click", () => this.nextQuestion());
    this.audioBtn.addEventListener("click", () => {
      if (this.currentQ) this.audio.speakJapanese(this.currentQ.targetWord.kana);
    });

    // Control de Rōmaji
    this.btnToggleRomaji.addEventListener("click", () => {
      this.showRomaji = !this.showRomaji;
      localStorage.setItem("koradevs_show_romaji", this.showRomaji);
      this._updateRomajiUI();
      if (this.currentQ && this.currentQ.direction === "es-jp" && !this.answered) {
        this._renderCurrentOptions();
      }
    });

    // Control de Categorías
    this.categorySelect.addEventListener("change", (e) => {
      const selected = e.target.value;
      this.filteredWords = selected === "all" 
        ? [...this.allWords] 
        : this.allWords.filter(w => w.cat === selected);
      
      if (this.isReviewMode) this._exitReviewMode();
      this.nextQuestion();
    });

    // Control de Dirección
    this.modeSelect.addEventListener("change", (e) => {
      this.quizMode = e.target.value;
      localStorage.setItem("koradevs_quiz_mode", this.quizMode);
      this.nextQuestion();
    });

    // Modo Repaso de Errores
    this.btnReviewMistakes.addEventListener("click", () => {
      const mistakes = this.storage.getMistakes();
      if (mistakes.length === 0 && !this.isReviewMode) {
        alert("🎉 ¡No tienes errores pendientes por repasar! Sigue practicando normalmente.");
        return;
      }

      this.isReviewMode = !this.isReviewMode;
      if (this.isReviewMode) {
        this._enterReviewMode();
      } else {
        this._exitReviewMode();
      }
      this.nextQuestion();
    });

    // Atajos de teclado: 1, 2, 3, 4 y Enter
    window.addEventListener("keydown", (e) => {
      if (document.getElementById("quizSection").style.display === "none") return;

      if (["1", "2", "3", "4"].includes(e.key) && !this.answered) {
        const index = parseInt(e.key, 10) - 1;
        const buttons = this.optionsContainer.querySelectorAll(".option-btn");
        if (buttons[index]) buttons[index].click();
      } else if ((e.key === "Enter" || e.key === " ") && this.answered) {
        e.preventDefault();
        this.nextQuestion();
      }
    });
  }

  _enterReviewMode() {
    this.isReviewMode = true;
    this.btnReviewMistakes.classList.add("active");
    this.reviewBanner.style.display = "block";
    this.categorySelect.disabled = true;
  }

  _exitReviewMode() {
    this.isReviewMode = false;
    this.btnReviewMistakes.classList.remove("active");
    this.reviewBanner.style.display = "none";
    this.categorySelect.disabled = false;
  }

  _updateRomajiUI() {
    this.romajiStatus.textContent = this.showRomaji ? "ON" : "OFF";
    this.btnToggleRomaji.classList.toggle("off", !this.showRomaji);
  }

  _updateMistakesCountUI() {
    const count = this.storage.getMistakes().length;
    this.mistakesCount.textContent = count;
    this.btnReviewMistakes.disabled = count === 0 && !this.isReviewMode;
  }

  nextQuestion() {
    this.answered = false;
    this.expBox.style.display = "none";
    this.nextBtn.style.display = "none";
    this.optionsContainer.innerHTML = "";

    // 1. Determinar el banco de palabras objetivo
    let pool = [];
    if (this.isReviewMode) {
      const mistakeKanas = this.storage.getMistakes();
      if (mistakeKanas.length === 0) {
        alert("🌟 ¡Excelente trabajo! Has corregido todos tus errores.");
        this._exitReviewMode();
        pool = this.filteredWords.length > 0 ? this.filteredWords : this.allWords;
      } else {
        pool = this.allWords.filter(w => mistakeKanas.includes(w.kana));
      }
    } else {
      pool = this.filteredWords.length > 0 ? this.filteredWords : this.allWords;
    }

    const target = pool[Math.floor(Math.random() * pool.length)];

    // 2. Determinar dirección
    let direction = this.quizMode;
    if (direction === "mixed") {
      direction = Math.random() > 0.5 ? "jp-es" : "es-jp";
    }

    // 3. Generar distractores del banco general
    const sameCat = this.allWords.filter(w => w.cat === target.cat && w.kana !== target.kana);
    const otherCat = this.allWords.filter(w => w.cat !== target.cat && w.kana !== target.kana);
    const candidatePool = [
      ...sameCat.sort(() => Math.random() - 0.5),
      ...otherCat.sort(() => Math.random() - 0.5)
    ];

    const distractors = [];
    for (const w of candidatePool) {
      if (!distractors.some(d => d.kana === w.kana)) {
        distractors.push(w);
      }
      if (distractors.length >= 3) break;
    }

    const rawOptions = [...distractors, target].sort(() => Math.random() - 0.5);

    this.currentQ = {
      direction,
      targetWord: target,
      rawOptions
    };

    // 4. Renderizar encabezado
    if (direction === "jp-es") {
      const romajiHtml = this.showRomaji ? ` (${target.romaji})` : "";
      this.questionTitleContainer.innerHTML = `¿Qué significa <span class="jp-highlight">${target.kana}</span>${romajiHtml}?`;
      this.audioBtn.style.display = "inline-flex";
    } else {
      this.questionTitleContainer.innerHTML = `¿Cómo se dice <span class="jp-highlight">${target.meaning}</span> en japonés?`;
      this.audioBtn.style.display = "none";
    }

    this._renderCurrentOptions();
    this._updateMistakesCountUI();
  }

  _renderCurrentOptions() {
    this.optionsContainer.innerHTML = "";
    const { direction, rawOptions } = this.currentQ;

    rawOptions.forEach((item, idx) => {
      let displayText = "";
      let matchValue = "";

      if (direction === "jp-es") {
        displayText = item.meaning;
        matchValue = item.meaning;
      } else {
        const romajiPart = this.showRomaji ? ` (${item.romaji})` : "";
        displayText = `${item.kana}${romajiPart}`;
        matchValue = item.kana;
      }

      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = `${idx + 1}. ${displayText}`;
      btn.dataset.match = matchValue;
      btn.onclick = () => this._handleSelection(matchValue, btn);
      this.optionsContainer.appendChild(btn);
    });
  }

  _handleSelection(selectedMatch, btnEl) {
    if (this.answered) return;
    this.answered = true;

    const { direction, targetWord } = this.currentQ;
    const correctMatch = direction === "jp-es" ? targetWord.meaning : targetWord.kana;
    const isCorrect = selectedMatch === correctMatch;

    const allBtns = this.optionsContainer.querySelectorAll(".option-btn");
    allBtns.forEach(b => {
      b.disabled = true;
      if (b.dataset.match === correctMatch) {
        b.classList.add("correct");
      }
    });

    this.audio.playFeedback(isCorrect);
    this.audioBtn.style.display = "inline-flex";

    const stats = this.storage.load();
    stats.total++;

    if (isCorrect) {
      stats.score++;
      stats.streak++;
      if (stats.streak > stats.bestStreak) {
        stats.bestStreak = stats.streak;
      }
      btnEl.classList.add("correct");
      this.expStatus.innerHTML = "✅ ¡Correcto!";
      this.expStatus.style.color = "#4ade80";
      this.expBox.className = "explanation-box correct-exp";

      // Si estábamos repasando un error y acertó, se elimina de la lista de fallos
      if (this.isReviewMode) {
        this.storage.removeMistake(targetWord.kana);
      }
    } else {
      stats.streak = 0;
      btnEl.classList.add("wrong");
      this.expStatus.innerHTML = "❌ Incorrecto (añadida a repaso)";
      this.expStatus.style.color = "#f87171";
      this.expBox.className = "explanation-box wrong-exp";

      // Registrar como palabra fallada
      this.storage.addMistake(targetWord.kana);
    }

    this.storage.save(stats);
    this.onStatsUpdate(stats);
    this._updateMistakesCountUI();

    const kanjiPart = (targetWord.kanji && targetWord.kanji !== targetWord.kana)
      ? `<br>Escritura Kanji: <b>${targetWord.kanji}</b>.` : "";
    this.expBody.innerHTML = `<b>${targetWord.kana}</b> (${targetWord.romaji}) = <i>${targetWord.meaning}</i>.${kanjiPart}`;

    this.expBox.style.display = "block";
    this.nextBtn.style.display = "block";
  }
}
