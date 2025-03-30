const registrationForm = document.getElementById('registration-form');
const loginForm = document.getElementById('login-form');
const gameContent = document.getElementById('game-content');
const registerEmailInput = document.getElementById('register-email');
const registerPasswordInput = document.getElementById('register-password');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const registerButton = document.getElementById('register-button');
const loginButton = document.getElementById('login-button');
const registerLink = document.getElementById('register-link');
const loginLink = document.getElementById('login-link');
const logoutButton = document.getElementById('logout-button');
const startButton = document.getElementById('start-button');
const startMessage = document.getElementById('start-message');

let currentUser = localStorage.getItem('currentUser');

const gameContainer = document.getElementById('game-container');
const timerDisplay = document.getElementById('timer');
const levelDisplay = document.getElementById('level');
const hintButton = document.getElementById('hint-button');
const resetButton = document.getElementById('reset-button');
const pauseButton = document.getElementById('pause-button');
const accountButton = document.getElementById('account-button');
const accountPage = document.getElementById('account-page');
const nicknameInput = document.getElementById('nickname-input');
const changeEmailInput = document.getElementById('change-email-input');
const changePasswordInput = document.getElementById('change-password-input');
const saveAccountButton = document.getElementById('save-account-button');
const closeAccountButton = document.getElementById('close-account-button');

let shapes = [];
let targets = [];
let level = 1;
let totalTime = 60;
let timerInterval;
let currentLevelData;
let hintIndex = 0;
let isPaused = false;
let hintUsed = false;

// Check for existing login on page load
if (currentUser) {
    gameContent.style.display = 'block';
    startMessage.style.display = 'block';
    startButton.style.display = 'block';
    loginForm.style.display = 'none';
} else {
    loginForm.style.display = 'block';
    registrationForm.style.display = 'none';
    gameContent.style.display = 'none';
}

// Registration
registerButton.addEventListener('click', () => {
    const email = registerEmailInput.value;
    const password = registerPasswordInput.value;
    const users = JSON.parse(localStorage.getItem('users')) || {};
    if (users[email]) {
        alert('Email already registered.');
        return;
    }
    users[email] = password;
    localStorage.setItem('users', JSON.stringify(users));
    alert('Registration successful. Please log in.');
    registrationForm.style.display = 'none';
    loginForm.style.display = 'block';
});

// Login
loginButton.addEventListener('click', () => {
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
    const users = JSON.parse(localStorage.getItem('users')) || {};
    if (users[email] && users[email] === password) {
        currentUser = email;
        localStorage.setItem('currentUser', currentUser);
        loginForm.style.display = 'none';
        gameContent.style.display = 'block';
        totalTime = 60;
        timerDisplay.textContent = 'Time: 1:00';
        startMessage.style.display = 'block';
        startButton.style.display = 'block';
    } else {
        alert('Invalid email or password.');
    }
});

// Switch to Login
loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registrationForm.style.display = 'none';
    loginForm.style.display = 'block';
});

// Switch to Register
registerLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registrationForm.style.display = 'block';
});

// Logout
logoutButton.addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem('currentUser');
    gameContent.style.display = 'none';
    loginForm.style.display = 'block';
});

// Start button
startButton.addEventListener('click', () => {
    startGame();
    startButton.style.display = 'none';
    startMessage.style.display = 'none';
});

// Account button
accountButton.addEventListener('click', () => {
    gameContent.style.display = 'none';
    accountPage.style.display = 'block';
    const users = JSON.parse(localStorage.getItem('users')) || {};
    nicknameInput.value = localStorage.getItem(`nickname-${currentUser}`) || '';
    changeEmailInput.value = currentUser;
});

// Save account changes
saveAccountButton.addEventListener('click', () => {
    const nickname = nicknameInput.value;
    const newEmail = changeEmailInput.value;
    const newPassword = changePasswordInput.value;

    if (nickname) {
        localStorage.setItem(`nickname-${currentUser}`, nickname);
    }

    if (newEmail && newEmail !== currentUser) {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        delete users[currentUser];
        users[newEmail] = newPassword;
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', newEmail);
        currentUser = newEmail;
    }

    if (newPassword) {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        users[currentUser] = newPassword;
        localStorage.setItem('users', JSON.stringify(users));
    }

    accountPage.style.display = 'none';
    gameContent.style.display = 'block';
});

// Close account page
closeAccountButton.addEventListener('click', () => {
    accountPage.style.display = 'none';
    gameContent.style.display = 'block';
});

function startGame() {
    createGrid();
    loadLevel(level);
    startTimer();
}

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
        totalTime += 30;
        loadLevel(level);
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        if (!isPaused) {
            totalTime--;
            if (totalTime < 0) {
                clearInterval(timerInterval);
                alert("Game Over! Time's up.");
                resetGame();
                return;
            }
            const minutes = Math.floor(totalTime / 60);
            const seconds = totalTime % 60;
            timerDisplay.textContent = `Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
    }, 1000);
}

function loadLevel(level) {
    currentLevelData = getLevelData(level);
    createShapesAndTargets(currentLevelData);
    hintUsed = false;
    hintButton.classList.remove('hint-disabled');
    hintButton.disabled = false; // Enable the button
}

function getLevelData(level) {
    let startLeft = 10;
    let startTop = 10;
    const spacing = 90;
    let numShapes = Math.min(level + 2, 9);
    const shapes = [];
    const targets = [];
    const colors = ['lightblue', 'lightgreen', 'lightcoral', 'yellow', 'orange', 'purple', 'cyan', 'pink', 'brown', 'gray', 'olive', 'teal', 'indigo', 'violet', 'gold', 'silver', 'salmon', 'coral', 'khaki', 'lavender', 'lime', 'maroon', 'blue', 'red', 'green', 'navy', 'crimson', 'forestgreen', 'goldenrod', 'darkorange', 'mediumpurple', 'skyblue', 'firebrick', 'seagreen', 'darkgoldenrod', 'peru', 'thistle'];
    const usedColors = [];
    const usedTargets = [];

    const rowThreshold = 5;

    // Ensure numShapes doesn't exceed grid cells
    numShapes = Math.min(numShapes, 25); // Limit to 25 grid cells

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
            shapeLeft = startLeft + (gameContainer.offsetWidth / 2);
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
    if (!hintUsed && hintIndex < shapes.length) {
        const targetCell = gameContainer.children[shapes[hintIndex].target];
        const shapeColor = shapes[hintIndex].element.style.backgroundColor;
        targetCell.classList.add('hinted');
        targetCell.style.backgroundColor = shapeColor;
        setTimeout(() => {
            targetCell.classList.remove('hinted');
            targetCell.style.backgroundColor = '';
        }, 2000);
        hintIndex++;
        hintUsed = true;
        hintButton.classList.add('hint-disabled');
        hintButton.disabled = true; // Disable the button
    }
});

resetButton.addEventListener('click', () => {
    resetGame();
});

pauseButton.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
});

function resetGame() {
    level = 1;
    totalTime = 60;
    levelDisplay.textContent = `Level: ${level}`;
    timerDisplay.textContent = 'Time: 1:00';
    clearInterval(timerInterval);
    gameContainer.innerHTML = '';
    hintUsed = false;
    hintButton.classList.remove('hint-disabled');
    hintButton.disabled = false; // Enable the button
    startGame();
}