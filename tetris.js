const BLOCK_SIZE = 30;
const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const COLORS = {
    cyan: '#00FFFF',
    yellow: '#FFFF00',
    purple: '#FF00FF',
    blue: '#0000FF',
    red: '#FF0000',
    green: '#00FF00',
    orange: '#FFA500'
};

const SHAPES = [
    [[1, 1, 1, 1]],  // I
    [[1, 1], [1, 1]],  // O
    [[1, 1, 1], [0, 1, 0]],  // T
    [[1, 1, 1], [1, 0, 0]],  // L
    [[1, 1, 1], [0, 0, 1]],  // J
    [[1, 1, 0], [0, 1, 1]],  // S
    [[0, 1, 1], [1, 1, 0]]   // Z
];

const canvas = document.getElementById('gameCanvas');
const nextCanvas = document.getElementById('nextCanvas');
const ctx = canvas.getContext('2d');
const nextCtx = nextCanvas.getContext('2d');

canvas.width = BLOCK_SIZE * GRID_WIDTH;
canvas.height = BLOCK_SIZE * GRID_HEIGHT;
nextCanvas.width = BLOCK_SIZE * 4;
nextCanvas.height = BLOCK_SIZE * 4;

let grid = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(0));
let colors = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(null));
let score = 0;
let level = 1;
let linesCleared = 0;
let currentPiece = null;
let nextPiece = null;
let gameLoop = null;
let isPaused = false;

class Tetromino {
    constructor(shape = null) {
        const idx = shape === null ? Math.floor(Math.random() * SHAPES.length) : SHAPES.indexOf(shape);
        this.shape = SHAPES[idx];
        this.color = Object.values(COLORS)[idx];
        this.x = Math.floor((GRID_WIDTH - this.shape[0].length) / 2);
        this.y = 0;
    }

    draw(ctx, offsetX = 0, offsetY = 0) {
        this.shape.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell) {
                    ctx.fillStyle = this.color;
                    ctx.fillRect(
                        (this.x + j + offsetX) * BLOCK_SIZE,
                        (this.y + i + offsetY) * BLOCK_SIZE,
                        BLOCK_SIZE - 1,
                        BLOCK_SIZE - 1
                    );
                }
            });
        });
    }
}

function checkCollision(piece, testX, testY) {
    return piece.shape.some((row, i) => {
        return row.some((cell, j) => {
            if (!cell) return false;
            const x = piece.x + j + testX;
            const y = piece.y + i + testY;
            return x < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT || (y >= 0 && grid[y][x]);
        });
    });
}

function lockPiece() {
    currentPiece.shape.forEach((row, i) => {
        row.forEach((cell, j) => {
            if (cell) {
                const y = currentPiece.y + i;
                const x = currentPiece.x + j;
                if (y >= 0) {
                    grid[y][x] = 1;
                    colors[y][x] = currentPiece.color;
                }
            }
        });
    });
}

function clearLines() {
    let linesCleared = 0;
    for (let i = GRID_HEIGHT - 1; i >= 0; i--) {
        if (grid[i].every(cell => cell)) {
            grid.splice(i, 1);
            colors.splice(i, 1);
            grid.unshift(Array(GRID_WIDTH).fill(0));
            colors.unshift(Array(GRID_WIDTH).fill(null));
            linesCleared++;
            i++;
        }
    }
    return linesCleared;
}

function updateScore(lines) {
    const points = [0, 100, 300, 500, 800];
    score += points[lines] * level;
    linesCleared += lines;
    level = Math.floor(linesCleared / 10) + 1;
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
}

function drawGrid() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    grid.forEach((row, i) => {
        row.forEach((cell, j) => {
            if (cell) {
                ctx.fillStyle = colors[i][j];
                ctx.fillRect(j * BLOCK_SIZE, i * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
            }
        });
    });
}

function drawNext() {
    nextCtx.fillStyle = '#000';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (nextPiece) {
        const offsetX = Math.floor((4 - nextPiece.shape[0].length) / 2);
        const offsetY = Math.floor((4 - nextPiece.shape.length) / 2);
        nextPiece.draw(nextCtx, offsetX - nextPiece.x, offsetY - nextPiece.y);
    }
}

function gameOver() {
    cancelAnimationFrame(gameLoop);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束!', canvas.width/2, canvas.height/2);
}

function update() {
    currentPiece.y++;
    if (checkCollision(currentPiece, 0, 0)) {
        currentPiece.y--;
        lockPiece();
        const lines = clearLines();
        if (lines > 0) {
            updateScore(lines);
        }
        currentPiece = nextPiece;
        nextPiece = new Tetromino();
        if (checkCollision(currentPiece, 0, 0)) {
            gameOver();
            return;
        }
        drawNext();
    }
}

function draw() {
    drawGrid();
    currentPiece.draw(ctx);
}

function gameStep() {
    if (!isPaused) {
        update();
        draw();
    }
    gameLoop = requestAnimationFrame(() => setTimeout(gameStep, 1000 / level));
}

function rotate() {
    const rotated = currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[row.length-1-i])
    );
    const originalShape = currentPiece.shape;
    currentPiece.shape = rotated;
    if (checkCollision(currentPiece, 0, 0)) {
        currentPiece.shape = originalShape;
    }
}

document.addEventListener('keydown', event => {
    if (!currentPiece) return;

    switch(event.keyCode) {
        case 37: // 左箭头
            if (!checkCollision(currentPiece, -1, 0)) currentPiece.x--;
            break;
        case 39: // 右箭头
            if (!checkCollision(currentPiece, 1, 0)) currentPiece.x++;
            break;
        case 40: // 下箭头
            if (!checkCollision(currentPiece, 0, 1)) currentPiece.y++;
            break;
        case 38: // 上箭头
            rotate();
            break;
        case 32: // 空格
            isPaused = !isPaused;
            break;
    }
    draw();
});

function startGame() {
    grid = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(0));
    colors = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(null));
    score = 0;
    level = 1;
    linesCleared = 0;
    document.getElementById('score').textContent = '0';
    document.getElementById('level').textContent = '1';
    currentPiece = new Tetromino();
    nextPiece = new Tetromino();
    drawNext();
    gameStep();
}

startGame(); 
