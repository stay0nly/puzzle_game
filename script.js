const gameContainer = document.getElementById('game-container');
const timerDisplay = document.getElementById('timer');
const levelDisplay = document.getElementById('level');
const hintButton = document.getElementById('hint-button');
const resetButton = document.getElementById('reset-button');
const pauseButton = document.getElementById('pause-button');

let shapes = [];
let targets = [];
let level = 1;
let totalTime = 0;
let timerInterval;
let currentLevelData;
let hintIndex = 0;
let isPaused = false;

function createGrid() {
    for (let i = 0; i < 25; i++) {
        const cell = document.createElement('div');
        cell.classList.add('grid-cell');
        gameContainer.appendChild(cell);
    }
}

function createShapesAndTargets(levelData) {
    shapes = [];
    targets = [];
    gameContainer.querySelectorAll('.shape').forEach(shape => shape.remove());
    gameContainer.querySelectorAll('.target').forEach(target => target.classList.remove('target'));

    levelData.shapes.forEach(shape => {
        const shapeElement = document.createElement('div');
        shapeElement.classList.add('shape');
        shapeElement.style.backgroundColor = shape.color;
        shapeElement.style.left = shape.startLeft;
        shapeElement.style.top = shape.startTop;
        shapeElement.dataset.originalLeft = shape.startLeft;
        shapeElement.dataset.originalTop = shape.startTop;
        gameContainer.appendChild(shapeElement);
        shapes.push({ element: shapeElement, target: shape.target });
    });

    levelData.targets.forEach(targetIndex => {
        gameContainer.children[targetIndex].classList.add('target');
        targets.push(targetIndex);
    });

    setupDragAndDrop();
    hintIndex = 0;
    gameContainer.querySelectorAll(".hinted").forEach(hinted => hinted.classList.remove("hinted"));
}

function setupDragAndDrop() {
    shapes.forEach(shapeObj => {
        const shape = shapeObj.element;
        let isDragging = false;
        let offsetX, offsetY;

        shape.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - shape.offsetLeft;
            offsetY = e.clientY - shape.offsetTop;
            shape.classList.add('dragging');
            shape.style.zIndex = 10;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            shape.style.left = e.clientX - offsetX + 'px';
            shape.style.top = e.clientY - offsetY + 'px';
        });

        document.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            shape.classList.remove('dragging');
            shape.style.zIndex = 1;
            snapToGrid(shapeObj);
        });
    });
}

function snapToGrid(shapeObj) {
    const shape = shapeObj.element;
    const shapeRect = shape.getBoundingClientRect();
    const gridCells = Array.from(gameContainer.children);

    let snapped = false;
    gridCells.forEach((cell, index) => {
        const cellRect = cell.getBoundingClientRect();

        const overlapX = Math.max(0, Math.min(shapeRect.right, cellRect.right) - Math.max(shapeRect.left, cellRect.left));
        const overlapY = Math.max(0, Math.min(shapeRect.bottom, cellRect.bottom) - Math.max(shapeRect.top, cellRect.top));
        const overlapArea = overlapX * overlapY;

        const shapeArea = shapeRect.width * shapeRect.height;

        const overlapPercentage = overlapArea / shapeArea;

        if (overlapPercentage > 0.8 && targets.includes(index)) {
            shape.style.left = cellRect.left + 'px';
            shape.style.top = cellRect.top + 'px';
            if (shapeObj.target === index) {
                snapped = true;
            } else {
                const originalColor = getComputedStyle(shape).backgroundColor;
                shape.style.backgroundColor = 'white';
                setTimeout(() => {
                    shape.style.backgroundColor = originalColor;
                    shape.style.left = shape.dataset.originalLeft;
                    shape.style.top = shape.dataset.originalTop;
                }, 1000);
            }
        }
    });
    if (snapped) checkWin();
}

function checkWin() {
    let allCorrect = true;
    shapes.forEach(shapeObj => {
        const shapeRect = shapeObj.element.getBoundingClientRect();
        const targetCellRect = gameContainer.children[shapeObj.target].getBoundingClientRect();
        if (!(shapeRect.left === targetCellRect.left && shapeRect.top === targetCellRect.top)) {
            allCorrect = false;
        }
    });
    if (allCorrect) {
        level++;
        levelDisplay.textContent = `Level: ${level}`;
        loadLevel(level);
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        if (!isPaused) {
            totalTime++;
            const minutes = Math.floor(totalTime / 60);
            const seconds = totalTime % 60;
            timerDisplay.textContent = `Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
    }, 1000);
}

function loadLevel(level) {
    currentLevelData = getLevelData(level);
    createShapesAndTargets(currentLevelData);
}

function getLevelData(level) {
    let startLeft = 10;
    let startTop = 10;
    const spacing = 90;
    const numShapes = Math.min(level + 2, 9);
    const shapes = [];
    const targets = [];
    const colors = ['lightblue', 'lightgreen', 'lightcoral', 'yellow', 'orange', 'purple', 'cyan', 'pink', 'brown', 'gray', 'olive', 'teal', 'indigo', 'violet', 'gold', 'silver', 'salmon', 'coral', 'khaki', 'lavender', 'lime', 'maroon', 'blue', 'red', 'green', 'navy', 'crimson', 'forestgreen', 'goldenrod', 'darkorange', 'mediumpurple', 'skyblue', 'firebrick', 'seagreen', 'darkgoldenrod', 'peru', 'thistle'];
    const usedColors = [];
    const usedTargets = [];

    const rowThreshold = 5; // Number of shapes before moving to the second row

    for (let i = 0; i < numShapes; i++) {
        let color, target;

        do {
            color = colors[Math.floor(Math.random() * colors.length)];
        } while (usedColors.includes(color));
        usedColors.push(color);

        do {
            target = Math.floor(Math.random() * 25);
        } while (usedTargets.includes(target));
        usedTargets.push(target);

        let shapeLeft = startLeft;
        let shapeTop = startTop;

        if (i >= rowThreshold) {
            shapeLeft = startLeft + (gameContainer.offsetWidth / 2); // Move to the right half
            shapeTop = startTop + ((i - rowThreshold) * spacing);
        } else {
            shapeTop = startTop + (i * spacing);
        }

        shapes.push({
            color: color,
            startLeft: `${shapeLeft}px`,
            startTop: `${shapeTop}px`,
            target: target
        });
        targets.push(target);
    }

    return { shapes: shapes, targets: targets };
}

hintButton.addEventListener('click', () => {
    if (hintIndex < shapes.length) {
        const targetCell = gameContainer.children[shapes[hintIndex].target];
        const shapeColor = shapes[hintIndex].element.style.backgroundColor; // Get shape color
        targetCell.classList.add('hinted');
        targetCell.style.backgroundColor = shapeColor; // Set target cell background color
        setTimeout(() => {
            targetCell.classList.remove('hinted');
            targetCell.style.backgroundColor = ''; // Clear background color
        }, 2000);
        hintIndex++;
    }
});

resetButton.addEventListener('click', () => {
    level = 1;
    levelDisplay.textContent = `Level: ${level}`;
    totalTime = 0;
    clearInterval(timerInterval);
    startTimer();
    loadLevel(level);
});

pauseButton.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
});

createGrid();
loadLevel(level);
startTimer();