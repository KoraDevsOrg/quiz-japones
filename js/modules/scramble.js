export class ScrambleModule {
  constructor(words, audioService) {
    this.words = words;
    this.audio = audioService;

    this.currentWord = null;
    this.syllables = [];
    this.slottedChips = [];
    this.streak = 0;

    // Elementos DOM
    this.meaningEl = document.getElementById("scrambleTargetMeaning");
    this.badgeEl = document.getElementById("scrambleCategoryBadge");
    this.slotsContainer = document.getElementById("scrambleSlots");
    this.poolContainer = document.getElementById("scramblePool");
    this.feedbackEl = document.getElementById("scrambleFeedback");
    this.btnClear = document.getElementById("btnScrambleClear");
    this.btnNext = document.getElementById("btnScrambleNext");
    this.streakEl = document.getElementById("scrambleStreakText");

    this._bindEvents();
  }

  _bindEvents() {
    this.btnClear.addEventListener("click", () => this._resetSlots());
    this.btnNext.addEventListener("click", () => this.nextWord());
  }

  nextWord() {
    this._resetUI();

    // 1. Filtrar palabras de 2 a 5 caracteres (ideales para formar)
    const candidates = this.words.filter(w => w.kana.length >= 2 && w.kana.length <= 5);
    this.currentWord = candidates[Math.floor(Math.random() * candidates.length)];

    this.meaningEl.textContent = this.currentWord.meaning;
    this.badgeEl.textContent = this.currentWord.cat || "Vocabulario";

    // 2. Segmentar correctamente caracteres japoneses (incluyendo diptongos pequeños)
    const tokens = this.currentWord.kana.match(/[ぁ-ん][ゃゅょ]?|[ァ-ン][ャュョ]?/g) || Array.from(this.currentWord.kana);

    this.syllables = tokens.map((s, idx) => ({ id: `syl-${idx}`, char: s }));

    // 3. Mezclar sílabas garantizando que no queden ya ordenadas por casualidad
    let scrambled = [...this.syllables].sort(() => Math.random() - 0.5);
    if (scrambled.map(s => s.char).join("") === this.currentWord.kana && scrambled.length > 1) {
      scrambled.reverse();
    }

    // 4. Renderizar fichas disponibles
    scrambled.forEach(item => {
      const chip = document.createElement("button");
      chip.className = "scramble-chip";
      chip.textContent = item.char;
      chip.dataset.id = item.id;
      chip.addEventListener("click", () => this._handlePoolChipClick(item, chip));
      this.poolContainer.appendChild(chip);
    });
  }

  _handlePoolChipClick(item, chipEl) {
    if (chipEl.classList.contains("disabled")) return;

    // Deshabilitar del banco y colocar en las casillas
    chipEl.classList.add("disabled");
    this.slottedChips.push({ item, originalChipEl: chipEl });

    const slotChip = document.createElement("button");
    slotChip.className = "scramble-chip in-slot";
    slotChip.textContent = item.char;
    slotChip.title = "Toca para retirar";
    slotChip.addEventListener("click", () => this._handleSlotChipClick(item, slotChip, chipEl));

    this.slotsContainer.appendChild(slotChip);

    // Si ya completó todas las casillas, verificar resultado
    if (this.slottedChips.length === this.syllables.length) {
      this._checkWord();
    }
  }

  _handleSlotChipClick(item, slotChipEl, originalChipEl) {
    // Retirar de la casilla y reactivar en el banco
    slotChipEl.remove();
    originalChipEl.classList.remove("disabled");
    this.slottedChips = this.slottedChips.filter(entry => entry.item.id !== item.id);
    this.slotsContainer.className = "scramble-slots";
    this.feedbackEl.style.display = "none";
  }

  _checkWord() {
    const formed = this.slottedChips.map(c => c.item.char).join("");
    const isCorrect = formed === this.currentWord.kana;

    if (isCorrect) {
      this.slotsContainer.className = "scramble-slots correct";
      this.audio.playFeedback(true);
      this.audio.speakJapanese(this.currentWord.kana);

      this.streak++;
      this.streakEl.textContent = `${this.streak} 🔥`;

      const kanjiInfo = (this.currentWord.kanji && this.currentWord.kanji !== this.currentWord.kana)
        ? ` (${this.currentWord.kanji})` : "";
      this.feedbackEl.innerHTML = `✅ ¡Correcto! <b>${this.currentWord.kana}</b>${kanjiInfo} — <i>${this.currentWord.romaji}</i>`;
      this.feedbackEl.style.display = "block";

      this.btnClear.style.display = "none";
      this.btnNext.style.display = "block";
    } else {
      this.slotsContainer.className = "scramble-slots wrong";
      this.audio.playFeedback(false);
      this.streak = 0;
      this.streakEl.textContent = `0 🔥`;

      this.feedbackEl.innerHTML = `❌ Aún no es correcto. Toca una ficha para moverla o usa Limpiar.`;
      this.feedbackEl.style.display = "block";
    }
  }

  _resetSlots() {
    this.slotsContainer.innerHTML = "";
    this.slottedChips = [];
    this.slotsContainer.className = "scramble-slots";
    this.feedbackEl.style.display = "none";

    const allPoolChips = this.poolContainer.querySelectorAll(".scramble-chip");
    allPoolChips.forEach(c => c.classList.remove("disabled"));
  }

  _resetUI() {
    this.slotsContainer.innerHTML = "";
    this.poolContainer.innerHTML = "";
    this.slottedChips = [];
    this.slotsContainer.className = "scramble-slots";
    this.feedbackEl.style.display = "none";
    this.btnClear.style.display = "block";
    this.btnNext.style.display = "none";
  }
}
