export class QuizModule {
  constructor(words, storageService, audioService, onStatsUpdate) {
    this.allWords = words;
    this.filteredWords = [...words];
    this.storage = storageService;
    this.audio = audioService;
    this.onStatsUpdate = onStatsUpdate;

    this.currentQ = null;
    this.answered = false;
    this.showRomaji = localStorage.getItem("koradevs_show_romaji") !== "false";

    // Elementos DOM
    this.wordJpEl = document.getElementById("wordJp");
    this.wordRomajiEl = document.getElementById("wordRomaji");
    this.romajiWrapper = document.getElementById("romajiWrapper");
    this.romajiStatus = document.getElementById("romajiStatus");
    this.btnToggleRomaji = document.getElementById("btnToggleRomaji");
    this.categorySelect = document.getElementById("categorySelect");

    this.optionsContainer = document.getElementById("optionsContainer");
    this.expBox = document.getElementById("explanationBox");
    this.expStatus = document.getElementById("expStatus");
    this.expBody = document.getElementById("expBody");
    this.nextBtn = document.getElementById("nextBtn");
    this.audioBtn = document.getElementById("btnPlayAudio");

    this._updateRomajiUI();
    this._bindEvents();
  }

  _bindEvents() {
    this.nextBtn.addEventListener("click", () => this.nextQuestion());
    this.audioBtn.addEventListener("click", () => {
      if (this.currentQ) this.audio.speakJapanese(this.currentQ.jp);
    });

    // Control de Rōmaji
    this.btnToggleRomaji.addEventListener("click", () => {
      this.showRomaji = !this.showRomaji;
      localStorage.setItem("koradevs_show_romaji", this.showRomaji);
      this._updateRomajiUI();
    });

    // Control de Categorías
    this.categorySelect.addEventListener("change", (e) => {
      const selected = e.target.value;
      if (selected === "all") {
        this.filteredWords = [...this.allWords];
      } else {
        this.filteredWords = this.allWords.filter(w => w.cat === selected);
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

  _updateRomajiUI() {
    if (this.showRomaji) {
      this.romajiWrapper.classList.remove("hide-romaji");
      this.romajiStatus.textContent = "ON";
      this.btnToggleRomaji.classList.remove("off");
    } else {
      this.romajiWrapper.classList.add("hide-romaji");
      this.romajiStatus.textContent = "OFF";
      this.btnToggleRomaji.classList.add("off");
    }
  }

  nextQuestion() {
    this.answered = false;
    this.expBox.style.display = "none";
    this.nextBtn.style.display = "none";
    this.optionsContainer.innerHTML = "";

    // 1. Elegir palabra objetivo del grupo filtrado
    const pool = this.filteredWords.length > 0 ? this.filteredWords : this.allWords;
    const target = pool[Math.floor(Math.random() * pool.length)];

    // 2. Generar distractores del banco general
    const sameCatWords = this.allWords.filter(w => w.cat === target.cat && w.meaning !== target.meaning);
    const otherCatWords = this.allWords.filter(w => w.cat !== target.cat && w.meaning !== target.meaning);

    const distractors = [];
    const optionCandidates = [
      ...sameCatWords.sort(() => Math.random() - 0.5),
      ...otherCatWords.sort(() => Math.random() - 0.5)
    ];

    for (const item of optionCandidates) {
      if (!distractors.includes(item.meaning)) {
        distractors.push(item.meaning);
      }
      if (distractors.length >= 3) break;
    }

    const options = [...distractors, target.meaning].sort(() => Math.random() - 0.5);

    this.currentQ = {
      jp: target.kana,
      romaji: target.romaji,
      kanji: target.kanji,
      correct: target.meaning,
      options
    };

    // Renderizar en UI
    this.wordJpEl.textContent = this.currentQ.jp;
    this.wordRomajiEl.textContent = this.currentQ.romaji;

    this.currentQ.options.forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = `${idx + 1}. ${opt}`;
      btn.onclick = () => this._handleSelection(opt, btn);
      this.optionsContainer.appendChild(btn);
    });
  }

  _handleSelection(selected, btnEl) {
    if (this.answered) return;
    this.answered = true;

    const isCorrect = selected === this.currentQ.correct;
    const allBtns = this.optionsContainer.querySelectorAll(".option-btn");

    allBtns.forEach(b => {
      b.disabled = true;
      if (b.textContent.slice(3) === this.currentQ.correct) {
        b.classList.add("correct");
      }
    });

    this.audio.playFeedback(isCorrect);

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
    } else {
      stats.streak = 0;
      btnEl.classList.add("wrong");
      this.expStatus.innerHTML = `❌ Incorrecto`;
      this.expStatus.style.color = "#f87171";
      this.expBox.className = "explanation-box wrong-exp";
    }

    this.storage.save(stats);
    this.onStatsUpdate(stats);

    const kanjiText = (this.currentQ.kanji && this.currentQ.kanji !== this.currentQ.jp)
      ? `<br>Escritura Kanji: <b>${this.currentQ.kanji}</b>.` : "";
    this.expBody.innerHTML = `<b>${this.currentQ.jp}</b> (${this.currentQ.romaji}) significa: <i>${this.currentQ.correct}</i>.${kanjiText}`;

    this.expBox.style.display = "block";
    this.nextBtn.style.display = "block";
  }
}
