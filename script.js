class Game2048 {
    constructor() {
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('best-score')) || 0;
        this.gameWon = false; // Track if player has won to avoid multiple win messages
        this.moveCount = 0; // Track number of moves
        this.gameHistory = []; // For undo functionality
        
        // Sound effects (using Web Audio API for better performance)
        this.audioContext = null;
        this.initAudio();
        
        this.tileContainer = document.getElementById('tile-container');
        this.scoreElement = document.getElementById('score');
        this.bestScoreElement = document.getElementById('best-score');
        this.moveCountElement = document.getElementById('move-count');
        this.gameMessage = document.getElementById('game-message');
        this.messageText = document.getElementById('message-text');
        
        this.updateDisplay();
        this.setupEventListeners();
        this.addRandomTile();
        this.addRandomTile();
        this.updateDisplay();
        this.showStartupHint();
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    playSound(frequency, duration = 0.1, type = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    showStartupHint() {
        // Show a subtle hint for first-time players
        if (!localStorage.getItem('game-played')) {
            setTimeout(() => {
                this.showTemporaryMessage('Use arrow keys or swipe to move tiles!', 3000);
                localStorage.setItem('game-played', 'true');
            }, 1000);
        }
    }
    
    showTemporaryMessage(text, duration = 2000) {
        const hint = document.createElement('div');
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
            hint.style.animation = 'fadeOut 0.3s ease-in-out';
            setTimeout(() => hint.remove(), 300);
        }, duration);
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            // Arrow keys for movement
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                this.handleMove(e.key);
            }
            
            // 'R' key for restart
            if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                this.restart();
            }
            
            // 'U' key for undo (if we implement it)
            if (e.key.toLowerCase() === 'u' && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                this.undo();
            }
            
            // Space bar to dismiss messages
            if (e.key === ' ' && this.gameMessage.classList.contains('show')) {
                e.preventDefault();
                this.hideMessage();
            }
        });
        
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.restart();
        });
        
        document.getElementById('try-again-btn').addEventListener('click', () => {
            this.restart();
        });
        
        // Touch controls
        let startX, startY;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX > 0) {
                    this.handleMove('ArrowLeft');
                } else {
                    this.handleMove('ArrowRight');
                }
            } else {
                if (diffY > 0) {
                    this.handleMove('ArrowUp');
                } else {
                    this.handleMove('ArrowDown');
                }
            }
            
            startX = null;
            startY = null;
        });
    }
    
    async handleMove(direction) {
        if (this.animating) return; // Prevent moves during animation
        
        // Save state before attempting move (for undo)
        this.saveGameState();
        
        const previousGrid = this.grid.map(row => [...row]);
        this.mergedTiles = [];
        let moved = false;
        let scoreGained = 0;
        const previousScore = this.score;
        
        switch (direction) {
            case 'ArrowLeft':
                moved = this.moveLeft();
                break;
            case 'ArrowRight':
                moved = this.moveRight();
                break;
            case 'ArrowUp':
                moved = this.moveUp();
                break;
            case 'ArrowDown':
                moved = this.moveDown();
                break;
        }
        
        if (moved) {
            this.moveCount++;
            scoreGained = this.score - previousScore;
            
            // Play move sound
            this.playSound(200 + (scoreGained / 10), 0.1);
            
            this.animating = true;
            await this.animateMove(previousGrid);
            this.addRandomTile();
            this.updateDisplay(); // Show the new tile with appear animation
            this.animating = false;
            
            // Show score gain animation
            if (scoreGained > 0) {
                this.showScoreGain(scoreGained);
            }
            
            // Check win condition (but only show message once)
            if (!this.gameWon && this.isGameWon()) {
                this.gameWon = true;
                this.playSound(800, 0.5, 'square'); // Victory sound
                setTimeout(() => this.showMessage('🎉 You Win! 🎉'), 300);
            } else if (this.isGameOver()) {
                this.playSound(100, 1, 'sawtooth'); // Game over sound
                setTimeout(() => this.showMessage('💀 Game Over! 💀'), 300);
            }
        } else {
            // Invalid move feedback
            this.playSound(150, 0.05, 'square');
            this.shakeGrid();
        }
    }
    
    showScoreGain(points) {
        const scoreGain = document.createElement('div');
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
        this.tileContainer.appendChild(scoreGain);
        
        setTimeout(() => scoreGain.remove(), 1000);
    }
    
    shakeGrid() {
        const gameContainer = document.querySelector('.game-container');
        gameContainer.style.animation = 'shake 0.3s ease-in-out';
        setTimeout(() => {
            gameContainer.style.animation = '';
        }, 300);
    }

    moveLeft() {
        let moved = false;
        for (let row = 0; row < 4; row++) {
            const arr = this.grid[row].filter(val => val !== 0);
            const merged = [];
            
            for (let i = 0; i < arr.length - 1; i++) {
                if (arr[i] === arr[i + 1]) {
                    arr[i] *= 2;
                    this.score += arr[i];
                    this.mergedTiles.push({ row, col: i, value: arr[i] });
                    arr[i + 1] = 0;
                    i++;
                }
            }
            
            const newRow = arr.filter(val => val !== 0);
            while (newRow.length < 4) {
                newRow.push(0);
            }
            
            for (let col = 0; col < 4; col++) {
                if (this.grid[row][col] !== newRow[col]) {
                    moved = true;
                }
                this.grid[row][col] = newRow[col];
            }
        }
        return moved;
    }
    
    moveRight() {
        let moved = false;
        for (let row = 0; row < 4; row++) {
            const arr = this.grid[row].filter(val => val !== 0);
            const merged = [];
            
            for (let i = arr.length - 1; i > 0; i--) {
                if (arr[i] === arr[i - 1]) {
                    arr[i] *= 2;
                    this.score += arr[i];
                    this.mergedTiles.push({ row, col: 4 - (arr.length - i), value: arr[i] });
                    arr[i - 1] = 0;
                    i--;
                }
            }
            
            const newRow = arr.filter(val => val !== 0);
            while (newRow.length < 4) {
                newRow.unshift(0);
            }
            
            for (let col = 0; col < 4; col++) {
                if (this.grid[row][col] !== newRow[col]) {
                    moved = true;
                }
                this.grid[row][col] = newRow[col];
            }
        }
        return moved;
    }
    
    moveUp() {
        let moved = false;
        for (let col = 0; col < 4; col++) {
            const arr = [];
            for (let row = 0; row < 4; row++) {
                if (this.grid[row][col] !== 0) {
                    arr.push(this.grid[row][col]);
                }
            }
            
            for (let i = 0; i < arr.length - 1; i++) {
                if (arr[i] === arr[i + 1]) {
                    arr[i] *= 2;
                    this.score += arr[i];
                    this.mergedTiles.push({ row: i, col, value: arr[i] });
                    arr[i + 1] = 0;
                    i++;
                }
            }
            
            const newCol = arr.filter(val => val !== 0);
            while (newCol.length < 4) {
                newCol.push(0);
            }
            
            for (let row = 0; row < 4; row++) {
                if (this.grid[row][col] !== newCol[row]) {
                    moved = true;
                }
                this.grid[row][col] = newCol[row];
            }
        }
        return moved;
    }
    
    moveDown() {
        let moved = false;
        for (let col = 0; col < 4; col++) {
            const arr = [];
            for (let row = 0; row < 4; row++) {
                if (this.grid[row][col] !== 0) {
                    arr.push(this.grid[row][col]);
                }
            }
            
            for (let i = arr.length - 1; i > 0; i--) {
                if (arr[i] === arr[i - 1]) {
                    arr[i] *= 2;
                    this.score += arr[i];
                    this.mergedTiles.push({ row: 4 - (arr.length - i), col, value: arr[i] });
                    arr[i - 1] = 0;
                    i--;
                }
            }
            
            const newCol = arr.filter(val => val !== 0);
            while (newCol.length < 4) {
                newCol.unshift(0);
            }
            
            for (let row = 0; row < 4; row++) {
                if (this.grid[row][col] !== newCol[row]) {
                    moved = true;
                }
                this.grid[row][col] = newCol[row];
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
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
            this.lastAddedTile = { row: randomCell.row, col: randomCell.col };
        }
    }

    async animateMove(previousGrid) {
        const isMobile = window.innerWidth <= 520;
        const tileSize = isMobile ? 70 : 100;
        const gap = isMobile ? 8 : 10;
        const spacing = tileSize + gap;
        
        // Clear container and create tiles in old positions
        this.tileContainer.innerHTML = '';
        const tileElements = [];
        
        // Create tiles for previous grid state
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (previousGrid[row][col] !== 0) {
                    const tile = document.createElement('div');
                    tile.className = `tile tile-${previousGrid[row][col]}`;
                    tile.textContent = previousGrid[row][col];
                    tile.style.left = `${col * spacing}px`;
                    tile.style.top = `${row * spacing}px`;
                    tile.style.transition = 'transform 0.2s ease-in-out';
                    tile.dataset.originalValue = previousGrid[row][col];
                    tile.dataset.fromRow = row;
                    tile.dataset.fromCol = col;
                    this.tileContainer.appendChild(tile);
                    tileElements.push(tile);
                }
            }
        }
        
        // Wait a frame before starting animation
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // Animate tiles to their new positions
        for (const tile of tileElements) {
            const value = parseInt(tile.dataset.originalValue);
            const fromRow = parseInt(tile.dataset.fromRow);
            const fromCol = parseInt(tile.dataset.fromCol);
            
            // Find new position for this tile
            const newPos = this.findNewPosition(value, fromRow, fromCol);
            if (newPos) {
                const deltaX = (newPos.col - fromCol) * spacing;
                const deltaY = (newPos.row - fromRow) * spacing;
                tile.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                
                // Check if this tile was merged
                const isMerged = this.mergedTiles.some(merged => 
                    merged.row === newPos.row && merged.col === newPos.col
                );
                
                if (isMerged) {
                    tile.dataset.willMerge = 'true';
                }
            }
        }
        
        // Wait for slide animation to complete
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Handle merges - update tiles that were merged
        for (const mergedTile of this.mergedTiles) {
            const mergedTiles = tileElements.filter(tile => {
                const newPos = this.findNewPosition(
                    parseInt(tile.dataset.originalValue), 
                    parseInt(tile.dataset.fromRow), 
                    parseInt(tile.dataset.fromCol)
                );
                return newPos && newPos.row === mergedTile.row && newPos.col === mergedTile.col;
            });
            
            if (mergedTiles.length > 0) {
                // Update the first tile to show the merged value
                const resultTile = mergedTiles[0];
                resultTile.textContent = mergedTile.value;
                resultTile.className = `tile tile-${mergedTile.value}`;
                resultTile.style.animation = 'merge 0.2s ease-in-out';
                
                // Remove other tiles that merged into this position
                for (let i = 1; i < mergedTiles.length; i++) {
                    mergedTiles[i].remove();
                }
            }
        }
        
        // Wait for merge animation
        if (this.mergedTiles.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Clear animations
        for (const tile of tileElements) {
            if (tile.parentNode) {
                tile.style.animation = '';
            }
        }
    }

    findNewPosition(value, fromRow, fromCol) {
        // For sliding tiles, find their destination in the new grid
        // We need to be smart about this - find the tile that moved from the original position
        let foundPositions = [];
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.grid[row][col] === value) {
                    foundPositions.push({ row, col });
                } else if (this.grid[row][col] === value * 2) {
                    // This might be a merged tile that our tile contributed to
                    foundPositions.push({ row, col });
                }
            }
        }
        
        // If only one position found, that's our destination
        if (foundPositions.length === 1) {
            return foundPositions[0];
        }
        
        // If multiple positions, choose the closest one to the original position
        if (foundPositions.length > 1) {
            let bestPos = foundPositions[0];
            let bestDistance = Math.abs(bestPos.row - fromRow) + Math.abs(bestPos.col - fromCol);
            
            for (let pos of foundPositions) {
                let distance = Math.abs(pos.row - fromRow) + Math.abs(pos.col - fromCol);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestPos = pos;
                }
            }
            return bestPos;
        }
        
        return null;
    }
    
    updateDisplay() {
        this.tileContainer.innerHTML = '';
        
        // Calculate proper spacing to match CSS grid layout exactly
        const isMobile = window.innerWidth <= 520;
        const tileSize = isMobile ? 70 : 100;
        const gap = isMobile ? 8 : 10;
        const spacing = tileSize + gap;
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.grid[row][col] !== 0) {
                    const tile = document.createElement('div');
                    tile.className = `tile tile-${this.grid[row][col]}`;
                    tile.textContent = this.grid[row][col];
                    
                    // Position tiles to align exactly with CSS grid
                    tile.style.left = `${col * spacing}px`;
                    tile.style.top = `${row * spacing}px`;
                    
                    // Add appear animation for new tiles
                    if (this.lastAddedTile && this.lastAddedTile.row === row && this.lastAddedTile.col === col) {
                        tile.style.animation = 'appear 0.2s ease-in-out';
                        setTimeout(() => {
                            tile.style.animation = '';
                        }, 200);
                    }
                    
                    this.tileContainer.appendChild(tile);
                }
            }
        }
        
        this.scoreElement.textContent = this.score;
        this.moveCountElement.textContent = this.moveCount;
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('best-score', this.bestScore);
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
                    (row < 3 && current === this.grid[row + 1][col]) ||
                    (col < 3 && current === this.grid[row][col + 1])
                ) {
                    return false;
                }
            }
        }
        return true;
    }
    
    showMessage(text) {
        this.messageText.textContent = text;
        this.gameMessage.classList.add('show');
    }
    
    hideMessage() {
        this.gameMessage.classList.remove('show');
    }
    
    restart() {
        // Confirmation for restart if game is in progress
        if (this.moveCount > 5 && this.score > 100) {
            if (!confirm('Are you sure you want to restart? Your progress will be lost.')) {
                return;
            }
        }
        
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.moveCount = 0;
        this.gameWon = false;
        this.animating = false;
        this.mergedTiles = [];
        this.lastAddedTile = null;
        this.gameHistory = []; // Clear undo history
        this.hideMessage();
        this.addRandomTile();
        this.addRandomTile();
        this.updateDisplay();
        this.playSound(300, 0.2);
        this.showTemporaryMessage('New game started! Press R to restart, U to undo.', 2000);
    }
    
    // Add undo functionality
    undo() {
        if (this.gameHistory.length === 0) {
            this.showTemporaryMessage('No moves to undo!', 1500);
            this.playSound(200, 0.1, 'square');
            return;
        }
        
        const lastState = this.gameHistory.pop();
        this.grid = lastState.grid;
        this.score = lastState.score;
        this.moveCount = Math.max(0, this.moveCount - 1);
        this.updateDisplay();
        this.playSound(350, 0.15);
        this.showTemporaryMessage('Move undone!', 1000);
    }
    
    // Save game state for undo
    saveGameState() {
        const state = {
            grid: this.grid.map(row => [...row]),
            score: this.score
        };
        this.gameHistory.push(state);
        
        // Keep only last 3 moves for undo
        if (this.gameHistory.length > 3) {
            this.gameHistory.shift();
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
