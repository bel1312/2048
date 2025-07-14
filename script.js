class Game2048 {
  constructor() {
    this.grid = Array(4)
      .fill()
      .map(() => Array(4).fill(0));
    this.score = 0;
    this.bestScore = parseInt(localStorage.getItem("best-score")) || 0;

    this.tileContainer = document.getElementById("tile-container");
    this.scoreElement = document.getElementById("score");
    this.bestScoreElement = document.getElementById("best-score");
    this.gameMessage = document.getElementById("game-message");
    this.messageText = document.getElementById("message-text");

    this.updateDisplay();
    this.setupEventListeners();
    this.addRandomTile();
    this.addRandomTile();
    this.updateDisplay();
  }

  setupEventListeners() {
    document.addEventListener("keydown", (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        this.handleMove(e.key);
      }
    });

    document.getElementById("new-game-btn").addEventListener("click", () => {
      this.restart();
    });

    document.getElementById("try-again-btn").addEventListener("click", () => {
      this.restart();
    });

    // Touch support for mobile
    let startX, startY;
    this.tileContainer.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    this.tileContainer.addEventListener("touchend", (e) => {
      if (!startX || !startY) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const diffX = startX - endX;
      const diffY = startY - endY;

      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
          this.handleMove("ArrowLeft");
        } else {
          this.handleMove("ArrowRight");
        }
      } else {
        if (diffY > 0) {
          this.handleMove("ArrowUp");
        } else {
          this.handleMove("ArrowDown");
        }
      }

      startX = null;
      startY = null;
    });
  }

  handleMove(direction) {
    const previousGrid = this.grid.map((row) => [...row]);
    let moved = false;

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
      this.addRandomTile();
      this.updateDisplay();

      if (this.isGameWon()) {
        this.showMessage("You Win!");
      } else if (this.isGameOver()) {
        this.showMessage("Game Over!");
      }
    }
  }

  moveLeft() {
    let moved = false;
    for (let row = 0; row < 4; row++) {
      const line = this.grid[row].filter((cell) => cell !== 0);
      for (let i = 0; i < line.length - 1; i++) {
        if (line[i] === line[i + 1]) {
          line[i] *= 2;
          this.score += line[i];
          line.splice(i + 1, 1);
        }
      }
      while (line.length < 4) {
        line.push(0);
      }

      for (let col = 0; col < 4; col++) {
        if (this.grid[row][col] !== line[col]) {
          moved = true;
        }
        this.grid[row][col] = line[col];
      }
    }
    return moved;
  }

  moveRight() {
    let moved = false;
    for (let row = 0; row < 4; row++) {
      const line = this.grid[row].filter((cell) => cell !== 0);
      for (let i = line.length - 1; i > 0; i--) {
        if (line[i] === line[i - 1]) {
          line[i] *= 2;
          this.score += line[i];
          line.splice(i - 1, 1);
          i--;
        }
      }
      while (line.length < 4) {
        line.unshift(0);
      }

      for (let col = 0; col < 4; col++) {
        if (this.grid[row][col] !== line[col]) {
          moved = true;
        }
        this.grid[row][col] = line[col];
      }
    }
    return moved;
  }

  moveUp() {
    let moved = false;
    for (let col = 0; col < 4; col++) {
      const line = [];
      for (let row = 0; row < 4; row++) {
        if (this.grid[row][col] !== 0) {
          line.push(this.grid[row][col]);
        }
      }

      for (let i = 0; i < line.length - 1; i++) {
        if (line[i] === line[i + 1]) {
          line[i] *= 2;
          this.score += line[i];
          line.splice(i + 1, 1);
        }
      }

      while (line.length < 4) {
        line.push(0);
      }

      for (let row = 0; row < 4; row++) {
        if (this.grid[row][col] !== line[row]) {
          moved = true;
        }
        this.grid[row][col] = line[row];
      }
    }
    return moved;
  }

  moveDown() {
    let moved = false;
    for (let col = 0; col < 4; col++) {
      const line = [];
      for (let row = 0; row < 4; row++) {
        if (this.grid[row][col] !== 0) {
          line.push(this.grid[row][col]);
        }
      }

      for (let i = line.length - 1; i > 0; i--) {
        if (line[i] === line[i - 1]) {
          line[i] *= 2;
          this.score += line[i];
          line.splice(i - 1, 1);
          i--;
        }
      }

      while (line.length < 4) {
        line.unshift(0);
      }

      for (let row = 0; row < 4; row++) {
        if (this.grid[row][col] !== line[row]) {
          moved = true;
        }
        this.grid[row][col] = line[row];
      }
    }
    return moved;
  }

  addRandomTile() {
    const emptyCells = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (this.grid[row][col] === 0) {
          emptyCells.push({ row, col });
        }
      }
    }

    if (emptyCells.length > 0) {
      const randomCell =
        emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.grid[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  updateDisplay() {
    this.tileContainer.innerHTML = "";

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (this.grid[row][col] !== 0) {
          const tile = document.createElement("div");
          tile.className = `tile tile-${this.grid[row][col]}`;
          tile.textContent = this.grid[row][col];
          tile.style.left = `${col * 110 + 10}px`;
          tile.style.top = `${row * 110 + 10}px`;
          this.tileContainer.appendChild(tile);
        }
      }
    }

    this.scoreElement.textContent = this.score;

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem("best-score", this.bestScore);
    }
    this.bestScoreElement.textContent = this.bestScore;
  }

  isGameWon() {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (this.grid[row][col] === 2048) {
          return true;
        }
      }
    }
    return false;
  }

  isGameOver() {
    // Check for empty cells
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (this.grid[row][col] === 0) {
          return false;
        }
      }
    }

    // Check for possible merges
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const current = this.grid[row][col];
        if (
          (row < 3 && this.grid[row + 1][col] === current) ||
          (col < 3 && this.grid[row][col + 1] === current)
        ) {
          return false;
        }
      }
    }

    return true;
  }

  showMessage(message) {
    this.messageText.textContent = message;
    this.gameMessage.classList.add("show");
  }

  hideMessage() {
    this.gameMessage.classList.remove("show");
  }

  restart() {
    this.grid = Array(4)
      .fill()
      .map(() => Array(4).fill(0));
    this.score = 0;
    this.hideMessage();
    this.addRandomTile();
    this.addRandomTile();
    this.updateDisplay();
  }
}

// Initialize the game when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new Game2048();
});

// Prevent scrolling when using arrow keys
document.addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();
  }
});
