export class WordSearchModule {
  constructor(words, audioService) {
    this.words = words;
    this.audio = audioService;
    this.size = 6;
    this.fillers = ["あ", "か", "さ", "た", "な", "は", "ま", "や", "ら", "わ", "き", "し", "ち", "に", "り", "て", "こ", "み", "い"];

    this.currentSelection = [];
    this.foundWords = [];
    this.activeWords = [];

    this.gridEl = document.getElementById("wsGrid");
    this.targetsEl = document.getElementById("wsTargets");
    this.btnReset = document.getElementById("btnResetWS");

    this.btnReset.addEventListener("click", () => this.generate());
  }

  generate() {
    this.gridEl.innerHTML = "";
    this.targetsEl.innerHTML = "";
    this.currentSelection = [];
    this.foundWords = [];

    // Seleccionar 4 palabras de 2 a 3 caracteres
    const pool = this.words.filter(w => w.kana.length >= 2 && w.kana.length <= 3);
    this.activeWords = [...pool].sort(() => Math.random() - 0.5).slice(0, 4);

    // Pintar etiquetas objetivo
    this.activeWords.forEach(w => {
      const tag = document.createElement("div");
      tag.className = "target-tag";
      tag.id = `ws-${w.kana}`;
      tag.innerHTML = `<b>${w.kana}</b> (${w.meaning})`;
      this.targetsEl.appendChild(tag);
    });

    const board = Array(this.size).fill(null).map(() => Array(this.size).fill(""));

    // Ubicar palabras (horizontal o vertical)
    this.activeWords.forEach(item => {
      const word = item.kana;
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 50) {
        attempts++;
        const isVertical = Math.random() > 0.5;
        const maxRow = isVertical ? this.size - word.length : this.size - 1;
        const maxCol = isVertical ? this.size - 1 : this.size - word.length;

        const row = Math.floor(Math.random() * (maxRow + 1));
        const col = Math.floor(Math.random() * (maxCol + 1));

        // Verificar si cabe sin colisiones incorrectas
        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          const r = isVertical ? row + i : row;
          const c = isVertical ? col : col + i;
          if (board[r][c] !== "" && board[r][c] !== word[i]) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          for (let i = 0; i < word.length; i++) {
            const r = isVertical ? row + i : row;
            const c = isVertical ? col : col + i;
            board[r][c] = word[i];
          }
          placed = true;
        }
      }
    });

    // Rellenar espacios vacíos
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (!board[r][c]) {
          board[r][c] = this.fillers[Math.floor(Math.random() * this.fillers.length)];
        }
      }
    }

    // Dibujar celdas
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.textContent = board[r][c];
        cell.onclick = () => this._handleCellClick(cell);
        this.gridEl.appendChild(cell);
      }
    }
  }

  _handleCellClick(cell) {
    if (cell.classList.contains("found")) return;

    if (cell.classList.contains("selected")) {
      cell.classList.remove("selected");
      this.currentSelection = this.currentSelection.filter(c => c !== cell);
    } else {
      cell.classList.add("selected");
      this.currentSelection.push(cell);
    }

    const formed = this.currentSelection.map(c => c.textContent).join("");
    const matched = this.activeWords.find(w => w.kana === formed);

    if (matched && !this.foundWords.includes(matched.kana)) {
      this.foundWords.push(matched.kana);
      this.audio.playFeedback(true);

      this.currentSelection.forEach(c => {
        c.classList.remove("selected");
        c.classList.add("found");
      });

      const tag = document.getElementById(`ws-${matched.kana}`);
      if (tag) tag.classList.add("done");

      this.currentSelection = [];

      if (this.foundWords.length === this.activeWords.length) {
        setTimeout(() => alert("🎉 ¡Excelente! Has completado la sopa de letras."), 200);
      }
    }
  }
}
