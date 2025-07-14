class Game2048 {
    constructor() {
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('best-score')) || 0;
        
        this.tileContainer = document.getElementById('tile-container');
        this.scoreElement = document.getElementById('score');
        this.bestScoreElement = document.getElementById('best-score');
        this.gameMessage = document.getElementById('game-message');
        this.messageText = document.getElementById('message-text');
        
        this.updateDisplay();
        this.setupEventListeners();
        this.addRandomTile();
        this.addRandomTile();
        this.updateDisplay();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                this.handleMove(e.key);
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
        
        const previousGrid = this.grid.map(row => [...row]);
        this.mergedTiles = [];
        let moved = false;
        
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
            this.animating = true;
            await this.animateMove(previousGrid);
            this.addRandomTile();
            this.updateDisplay(); // Show the new tile with appear animation
            this.animating = false;
            
            if (this.isGameWon()) {
                this.showMessage('You Win!');
            } else if (this.isGameOver()) {
                this.showMessage('Game Over!');
            }
        }
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
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.animating = false;
        this.mergedTiles = [];
        this.lastAddedTile = null;
        this.hideMessage();
        this.addRandomTile();
        this.addRandomTile();
        this.updateDisplay();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
