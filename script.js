class Game2048 {
  constructor() {
    this.grid = Array(4)
      .fill()
      .map(() => Array(4).fill(0));
    this.score = 0;
    this.bestScore = parseInt(localStorage.getItem("best-score")) || 0;
    this.moveCount = 0;
    this.gameWon = false;
    this.animating = false;
    this.mergedTiles = [];
    this.lastAddedTile = null;
    this.gameHistory = [];
    this.tileMovements = [];
    this.audioContext = null;
    this.initAudio();

    this.gridElement = document.getElementById("grid");
    this.scoreElement = document.getElementById("score");
    this.bestScoreElement = document.getElementById("best-score");
    this.moveCountElement = document.getElementById("move-count");
    this.gameMessage = document.getElementById("game-message");
    this.messageText = document.getElementById("message-text");

    this.updateDisplay();
    this.setupEventListeners();
    this.addRandomTile();
    this.addRandomTile();
    this.updateDisplay();
    this.showStartupHint();
  }

  initAudio() {
    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
    } catch (e) {
      // No audio support
    }
  }

  playSound(frequency, duration = 0.1, type = "sine") {
    if (!this.audioContext) return;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + duration
    );
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  showStartupHint() {
    if (!localStorage.getItem("game-played")) {
      setTimeout(() => {
        this.showTemporaryMessage(
          "Use arrow keys or swipe to move tiles!",
          3000
        );
        localStorage.setItem("game-played", "true");
      }, 1000);
    }
  }

  showTemporaryMessage(text, duration = 2000) {
    const hint = document.createElement("div");
    hint.textContent = text;
    hint.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 1000;
      font-size: 14px;
      animation: fadeIn 0.3s ease-in-out;
    `;
    document.body.appendChild(hint);
    setTimeout(() => {
      hint.style.animation = "fadeOut 0.3s ease-in-out";
      setTimeout(() => hint.remove(), 300);
    }, duration);
  }

  setupEventListeners() {
    document.addEventListener("keydown", (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        this.handleMove(e.key);
      }
      if (e.key.toLowerCase() === "r" && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        this.restart();
      }
      if (e.key.toLowerCase() === "u" && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        this.undo();
      }
      if (e.key === " " && this.gameMessage.classList.contains("show")) {
        e.preventDefault();
        this.hideMessage();
      }
    });
    document
      .getElementById("new-game-btn")
      .addEventListener("click", () => this.restart());
    document
      .getElementById("try-again-btn")
      .addEventListener("click", () => this.restart());
    // Touch controls
    let startX, startY;
    document.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });
    document.addEventListener("touchend", (e) => {
      if (!startX || !startY) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = startX - endX;
      const diffY = startY - endY;
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) this.handleMove("ArrowLeft");
        else this.handleMove("ArrowRight");
      } else {
        if (diffY > 0) this.handleMove("ArrowUp");
        else this.handleMove("ArrowDown");
      }
      startX = null;
      startY = null;
    });
  }

  async handleMove(direction) {
    if (this.animating) return;
    this.saveGameState();
    const previousGrid = this.grid.map((row) => [...row]);
    this.mergedTiles = [];
    this.tileMovements = [];
    let moved = false;
    let scoreGained = 0;
    const previousScore = this.score;
    switch (direction) {
      case "ArrowLeft":
        moved = this.moveLeft();
        break;
      case "ArrowRight":
        moved = this.moveRight();
        break;
      case "ArrowUp":
        moved = this.moveUp();
        break;
      case "ArrowDown":
        moved = this.moveDown();
        break;
    }
    if (moved) {
      this.moveCount++;
      scoreGained = this.score - previousScore;
      this.playSound(200 + scoreGained / 10, 0.1);
      this.animating = true;
      await this.animateMove(previousGrid);
      this.addRandomTile();
      this.updateDisplay();
      this.animating = false;
      if (scoreGained > 0) this.showScoreGain(scoreGained);
      if (!this.gameWon && this.isGameWon()) {
        this.gameWon = true;
        this.playSound(800, 0.5, "square");
        setTimeout(() => this.showMessage("🎉 You Win! 🎉"), 300);
      } else if (this.isGameOver()) {
        this.playSound(100, 1, "sawtooth");
        setTimeout(() => this.showMessage("💀 Game Over! 💀"), 300);
      }
    } else {
      this.playSound(150, 0.05, "square");
      this.shakeGrid();
    }
  }

  recordMovement(
    fromRow,
    fromCol,
    toRow,
    toCol,
    merged = false,
    mergedFrom = null
  ) {
    this.tileMovements.push({
      fromRow,
      fromCol,
      toRow,
      toCol,
      merged,
      mergedFrom,
    });
  }

  moveLeft() {
    let moved = false;
    for (let row = 0; row < 4; row++) {
      let arr = [];
      let positions = [];
      for (let col = 0; col < 4; col++) {
        if (this.grid[row][col] !== 0) {
          arr.push(this.grid[row][col]);
          positions.push(col);
        }
      }
      let newRow = [];
      let skip = false;
      for (let i = 0, j = 0; i < arr.length; i++) {
        if (!skip && i < arr.length - 1 && arr[i] === arr[i + 1]) {
          let val = arr[i] * 2;
          this.score += val;
          this.mergedTiles.push({ row, col: j, value: val });
          newRow.push(val);
          this.recordMovement(row, positions[i], row, j, true, {
            row,
            col: positions[i + 1],
          });
          this.recordMovement(row, positions[i + 1], row, j, true, {
            row,
            col: positions[i],
          });
          i++;
        } else {
          newRow.push(arr[i]);
          this.recordMovement(row, positions[i], row, j);
        }
        j++;
      }
      while (newRow.length < 4) newRow.push(0);
      for (let col = 0; col < 4; col++) {
        if (this.grid[row][col] !== newRow[col]) moved = true;
        this.grid[row][col] = newRow[col];
      }
    }
    return moved;
  }

  moveRight() {
    let moved = false;
    for (let row = 0; row < 4; row++) {
      let arr = [];
      let positions = [];
      for (let col = 3; col >= 0; col--) {
        if (this.grid[row][col] !== 0) {
          arr.push(this.grid[row][col]);
          positions.push(col);
        }
      }
      let newRow = [];
      let skip = false;
      for (let i = 0, j = 0; i < arr.length; i++) {
        if (!skip && i < arr.length - 1 && arr[i] === arr[i + 1]) {
          let val = arr[i] * 2;
          this.score += val;
          this.mergedTiles.push({ row, col: 3 - j, value: val });
          newRow.push(val);
          this.recordMovement(row, positions[i], row, 3 - j, true, {
            row,
            col: positions[i + 1],
          });
          this.recordMovement(row, positions[i + 1], row, 3 - j, true, {
            row,
            col: positions[i],
          });
          i++;
        } else {
          newRow.push(arr[i]);
          this.recordMovement(row, positions[i], row, 3 - j);
        }
        j++;
      }
      while (newRow.length < 4) newRow.push(0);
      newRow = newRow.reverse();
      for (let col = 0; col < 4; col++) {
        if (this.grid[row][col] !== newRow[col]) moved = true;
        this.grid[row][col] = newRow[col];
      }
    }
    return moved;
  }

  moveUp() {
    let moved = false;
    for (let col = 0; col < 4; col++) {
      let arr = [];
      let positions = [];
      for (let row = 0; row < 4; row++) {
        if (this.grid[row][col] !== 0) {
          arr.push(this.grid[row][col]);
          positions.push(row);
        }
      }
      let newCol = [];
      let skip = false;
      for (let i = 0, j = 0; i < arr.length; i++) {
        if (!skip && i < arr.length - 1 && arr[i] === arr[i + 1]) {
          let val = arr[i] * 2;
          this.score += val;
          this.mergedTiles.push({ row: j, col, value: val });
          newCol.push(val);
          this.recordMovement(positions[i], col, j, col, true, {
            row: positions[i + 1],
            col,
          });
          this.recordMovement(positions[i + 1], col, j, col, true, {
            row: positions[i],
            col,
          });
          i++;
        } else {
          newCol.push(arr[i]);
          this.recordMovement(positions[i], col, j, col);
        }
        j++;
      }
      while (newCol.length < 4) newCol.push(0);
      for (let row = 0; row < 4; row++) {
        if (this.grid[row][col] !== newCol[row]) moved = true;
        this.grid[row][col] = newCol[row];
      }
    }
    return moved;
  }

  moveDown() {
    let moved = false;
    for (let col = 0; col < 4; col++) {
      let arr = [];
      let positions = [];
      for (let row = 3; row >= 0; row--) {
        if (this.grid[row][col] !== 0) {
          arr.push(this.grid[row][col]);
          positions.push(row);
        }
      }
      let newCol = [];
      let skip = false;
      for (let i = 0, j = 0; i < arr.length; i++) {
        if (!skip && i < arr.length - 1 && arr[i] === arr[i + 1]) {
          let val = arr[i] * 2;
          this.score += val;
          this.mergedTiles.push({ row: 3 - j, col, value: val });
          newCol.push(val);
          this.recordMovement(positions[i], col, 3 - j, col, true, {
            row: positions[i + 1],
            col,
          });
          this.recordMovement(positions[i + 1], col, 3 - j, col, true, {
            row: positions[i],
            col,
          });
          i++;
        } else {
          newCol.push(arr[i]);
          this.recordMovement(positions[i], col, 3 - j, col);
        }
        j++;
      }
      while (newCol.length < 4) newCol.push(0);
      newCol = newCol.reverse();
      for (let row = 0; row < 4; row++) {
        if (this.grid[row][col] !== newCol[row]) moved = true;
        this.grid[row][col] = newCol[row];
      }
    }
    return moved;
  }

  addRandomTile() {
    const emptyCells = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (this.grid[row][col] === 0) emptyCells.push({ row, col });
      }
    }
    if (emptyCells.length > 0) {
      const randomCell =
        emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.grid[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
      this.lastAddedTile = { row: randomCell.row, col: randomCell.col };
    }
  }

  async animateMove(previousGrid) {
    // No need for pixel math, just re-render tiles in new positions
    // We'll use a quick timeout to simulate the move, then trigger merge animation
    this.renderTiles(previousGrid); // Show old state
    await new Promise((resolve) => setTimeout(resolve, 80)); // Simulate move
    this.renderTiles(this.grid, true); // Show new state, with merge animation
    await new Promise((resolve) => setTimeout(resolve, 180)); // Wait for merge anim
  }

  updateDisplay() {
    this.renderTiles(this.grid);
    this.scoreElement.textContent = this.score;
    this.moveCountElement.textContent = this.moveCount;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem("best-score", this.bestScore);
    }
    this.bestScoreElement.textContent = this.bestScore;
  }

  renderTiles(grid, animateMerge = false) {
    // Remove all tiles from grid cells
    Array.from(this.gridElement.querySelectorAll(".tile")).forEach((el) =>
      el.remove()
    );
    const bgCells = this.gridElement.querySelectorAll(".grid-cell[data-bg]");
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (grid[row][col] !== 0) {
          const tile = document.createElement("div");
          tile.className = `tile tile-${grid[row][col]}`;
          tile.textContent = grid[row][col];
          // Appear animation for new tile
          if (
            this.lastAddedTile &&
            this.lastAddedTile.row === row &&
            this.lastAddedTile.col === col &&
            !animateMerge
          ) {
            tile.style.animation = "appear 0.2s ease-in-out";
            setTimeout(() => {
              tile.style.animation = "";
            }, 200);
          }
          // Merge animation
          if (
            animateMerge &&
            this.mergedTiles.some((mt) => mt.row === row && mt.col === col)
          ) {
            tile.classList.add("merge");
            tile.addEventListener("animationend", function handler() {
              tile.classList.remove("merge");
              tile.removeEventListener("animationend", handler);
            });
          }
          // Append tile to the correct grid cell
          const cellIndex = row * 4 + col;
          bgCells[cellIndex].appendChild(tile);
        }
      }
    }
  }

  isGameWon() {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (this.grid[row][col] === 2048) return true;
      }
    }
    return false;
  }

  isGameOver() {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (this.grid[row][col] === 0) return false;
      }
    }
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const current = this.grid[row][col];
        if (
          (row < 3 && current === this.grid[row + 1][col]) ||
          (col < 3 && current === this.grid[row][col + 1])
        )
          return false;
      }
    }
    return true;
  }

  showMessage(text) {
    this.messageText.textContent = text;
    this.gameMessage.classList.add("show");
  }

  hideMessage() {
    this.gameMessage.classList.remove("show");
  }

  restart() {
    if (this.moveCount > 5 && this.score > 100) {
      if (
        !confirm(
          "Are you sure you want to restart? Your progress will be lost."
        )
      )
        return;
    }
    this.grid = Array(4)
      .fill()
      .map(() => Array(4).fill(0));
    this.score = 0;
    this.moveCount = 0;
    this.gameWon = false;
    this.animating = false;
    this.mergedTiles = [];
    this.lastAddedTile = null;
    this.gameHistory = [];
    this.hideMessage();
    this.addRandomTile();
    this.addRandomTile();
    this.updateDisplay();
    this.playSound(300, 0.2);
    this.showTemporaryMessage(
      "New game started! Press R to restart, U to undo.",
      2000
    );
  }

  undo() {
    if (this.gameHistory.length === 0) {
      this.showTemporaryMessage("No moves to undo!", 1500);
      this.playSound(200, 0.1, "square");
      return;
    }
    const lastState = this.gameHistory.pop();
    this.grid = lastState.grid;
    this.score = lastState.score;
    this.moveCount = Math.max(0, this.moveCount - 1);
    this.updateDisplay();
    this.playSound(350, 0.15);
    this.showTemporaryMessage("Move undone!", 1000);
  }

  saveGameState() {
    const state = {
      grid: this.grid.map((row) => [...row]),
      score: this.score,
    };
    this.gameHistory.push(state);
    if (this.gameHistory.length > 3) this.gameHistory.shift();
  }

  showScoreGain(points) {
    const scoreGain = document.createElement("div");
    scoreGain.textContent = `+${points}`;
    scoreGain.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #f67c5f;
      font-size: 24px;
      font-weight: bold;
      pointer-events: none;
      z-index: 100;
      animation: scoreFloat 1s ease-out forwards;
    `;
    this.gridElement.appendChild(scoreGain);
    setTimeout(() => scoreGain.remove(), 1000);
  }

  shakeGrid() {
    const gameContainer = document.querySelector(".game-container");
    gameContainer.style.animation = "shake 0.3s ease-in-out";
    setTimeout(() => {
      gameContainer.style.animation = "";
    }, 300);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Game2048();
});
