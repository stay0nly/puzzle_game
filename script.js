const registrationForm = document.getElementById('registration-form');
const loginForm = document.getElementById('login-form');
const gameContent = document.getElementById('game-content');
const registerNicknameInput = document.getElementById('register-nickname');
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
const scoreDisplay = document.getElementById('score');
const leaderboardList = document.getElementById('leaderboard-list');
const scoreContainer = document.getElementById('score-container');
const rulesButton = document.getElementById('rules-button');
const rulesDisplay = document.getElementById('rules-display');
const closeRulesButton = document.getElementById('close-rules');

// Add event listener to the Rules button
rulesButton.addEventListener('click', () => {
    rulesDisplay.style.display = 'block';
});

// Add event listener to the Close button
closeRulesButton.addEventListener('click', () => {
    rulesDisplay.style.display = 'none';
});

// Function to close the rules display
function closeRules() {
    rulesDisplay.style.display = 'none';
}

// Event listener for the Rules button
rulesButton.addEventListener('click', () => {
    rulesDisplay.style.display = 'block';
});

// Event listener for the Close button (optional, for redundancy)
closeRulesButton.addEventListener('click', closeRules);

// Event listener to close rules when clicking anywhere outside the rules display
document.addEventListener('click', (event) => {
    if (rulesDisplay.style.display === 'block' && !rulesDisplay.contains(event.target) && event.target !== rulesButton) {
        closeRules();
    }
});

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAxPMh5eVCYvczqJr3d0isPL5aKC828AJc",
    authDomain: "puzzle-game-6cfac.firebaseapp.com",
    projectId: "puzzle-game-6cfac",
    storageBucket: "puzzle-game-6cfac.firebasestorage.app",
    messagingSenderId: "417560576370",
    appId: "1:417560576370:web:d28e73f9227eea55251deb",
    measurementId: "G-7GVX10LZLW"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();


let score = 0;
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

// Registration with Firebase Authentication
registerButton.addEventListener('click', () => {
    const nickname = registerNicknameInput.value;
    const email = registerEmailInput.value;
    const password = registerPasswordInput.value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            // Store nickname in Firebase Realtime Database
            database.ref('users/' + user.uid).set({
                nickname: nickname
            });
            alert('Registration successful. Please log in.');
            registrationForm.style.display = 'none';
            loginForm.style.display = 'block';
        })
        .catch((error) => {
            alert(error.message);
        });
});

// Login
loginButton.addEventListener('click', () => {
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            // Retrieve nickname from Firebase Realtime Database
            database.ref('users/' + user.uid + '/nickname').once('value').then((snapshot) => {
                const nickname = snapshot.val();
                localStorage.setItem(`nickname-${user.email}`, nickname);
                currentUser = user.email;
                localStorage.setItem('currentUser', currentUser);
                loginForm.style.display = 'none';
                gameContent.style.display = 'block';
                totalTime = 60;
                timerDisplay.textContent = 'Time: 1:00';
                startMessage.style.display = 'block';
                startButton.style.display = 'block';
            });
        })
        .catch((error) => {
            alert(error.message);
        });
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

    // Enable buttons when game starts
    hintButton.disabled = false;
    resetButton.disabled = false;
    pauseButton.disabled = false;
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
    gameContainer.innerHTML = '';
    for (let i = 0; i < 25; i++) {
        const cell = document.createElement('div');
        cell.classList.add('grid-cell');
        gameContainer.appendChild(cell);
    }
    // Add obstacle class to obstacle cells
    if (currentLevelData && currentLevelData.obstacles) {
        currentLevelData.obstacles.forEach(obstacleIndex => {
            if (gameContainer.children[obstacleIndex]) {
                gameContainer.children[obstacleIndex].classList.add('obstacle');
            }
        });
    }
}

function createShapesAndTargets(levelData) {
    shapes = [];
    targets = [];
    gameContainer.querySelectorAll('.shape').forEach(shape => shape.remove());
    gameContainer.querySelectorAll('.target').forEach(target => {
        target.classList.remove('target');
        target.textContent = ''; // Clear any previous numbers
    });

    levelData.shapes.forEach(shape => {
        const shapeElement = document.createElement('div');
        shapeElement.classList.add('shape');
        shapeElement.style.backgroundColor = shape.color;
        shapeElement.style.left = shape.startLeft;
        shapeElement.style.top = shape.startTop;
        shapeElement.dataset.originalLeft = shape.startLeft;
        shapeElement.dataset.originalTop = shape.startTop;
        shapeElement.dataset.targetOrder = shape.order; // Store the required order
        gameContainer.appendChild(shapeElement);
        shapes.push({ element: shapeElement, target: shape.target, order: shape.order });
    });

    levelData.targets.forEach((targetIndex, index) => {
        const targetCell = gameContainer.children[targetIndex];
        targetCell.classList.add('target');
        targetCell.textContent = index + 1; // Display the target number
        targets.push(targetIndex);
    });

    if (currentLevelData && currentLevelData.obstacles) {
        currentLevelData.obstacles.forEach(obstacleIndex => {
            if (gameContainer.children[obstacleIndex]) {
                gameContainer.children[obstacleIndex].classList.add('obstacle');
            }
        });
    }

    setupDragAndDrop();
    hintIndex = 0;
    gameContainer.querySelectorAll(".hinted").forEach(hinted => hinted.classList.remove("hinted"));
    expectedTargetOrder = 1; // Initialize the expected target order
}

let expectedTargetOrder = 1;

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
            e.preventDefault(); // Prevent default drag-and-drop behavior
            snapToGrid(shapeObj);
        });
    });
}

function snapToGrid(shapeObj) {
    const shape = shapeObj.element;
    const shapeRect = shape.getBoundingClientRect();
    const gridCells = Array.from(gameContainer.children);
    const shapeOrder = parseInt(shape.dataset.targetOrder);

    console.log("Dragging shape order:", shapeOrder, "Expected order:", expectedTargetOrder);

    let snapped = false;
    let snappedCellIndex = -1;

    for (let i = 0; i < gridCells.length; i++) {
        const cell = gridCells[i];
        const cellRect = cell.getBoundingClientRect();
        const cellTargetOrder = parseInt(cell.textContent);

        const overlapX = Math.max(0, Math.min(shapeRect.right, cellRect.right) - Math.max(shapeRect.left, cellRect.left));
        const overlapY = Math.max(0, Math.min(shapeRect.bottom, cellRect.bottom) - Math.max(shapeRect.top, cellRect.top));
        const overlapArea = overlapX * overlapY;
        const overlapPercentage = overlapArea / (shapeRect.width * shapeRect.height);

        if (overlapPercentage > 0.8) {
            console.log("Overlapping with cell:", i, "Target Order:", cellTargetOrder, "Is Target:", cell.classList.contains('target'), "Is Obstacle:", cell.classList.contains('obstacle'));

            if (cell.classList.contains('obstacle')) {
                shape.style.left = shape.dataset.originalLeft;
                shape.style.top = shape.dataset.originalTop;
                console.log("Prevented snap to obstacle.");
            } else if (cell.classList.contains('target') && cellTargetOrder === shapeOrder && shapeOrder === expectedTargetOrder) {
                shape.style.left = cellRect.left + 'px';
                shape.style.top = cellRect.top + 'px';
                snapped = true;
                snappedCellIndex = i;
                console.log("Snapped to cell:", i);
                break; // Exit the loop once snapped
            } else {
                const originalColor = getComputedStyle(shape).backgroundColor;
                shape.style.backgroundColor = 'white';
                setTimeout(() => {
                    shape.style.backgroundColor = originalColor;
                    shape.style.left = shape.dataset.originalLeft;
                    shape.style.top = shape.dataset.originalTop;
                    console.log("Reverted color and position due to incorrect target or order.");
                }, 1000);
            }
        }
    }

    if (snapped) {
        console.log("Shape successfully snapped. Incrementing expected order.");
        expectedTargetOrder++;
        shapeObj.placed = true;
        checkWin();
    } else {
        console.log("No snap occurred.");
    }
}

// Function to update the leaderboard in Firebase
function updateLeaderboard(nickname, score) {
    const leaderboardRef = database.ref('leaderboard');
    leaderboardRef.orderByChild('score').limitToLast(10).once('value', (snapshot) => {
        let leaderboard = [];
        snapshot.forEach((childSnapshot) => {
            leaderboard.push(childSnapshot.val());
        });
        leaderboard.reverse(); // Reverse to get highest scores first

        let playerIndex = -1;
        for (let i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].nickname === nickname) {
                playerIndex = i;
                break;
            }
        }
        if (playerIndex !== -1) {
            if (score > leaderboard[playerIndex].score) {
                leaderboard[playerIndex].score = score;
            }
        } else {
            leaderboard.push({ nickname, score });
        }
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 10);
        leaderboardRef.set(leaderboard);
    });
}

// Function to display the leaderboard from Firebase
function displayLeaderboard() {
    const leaderboardRef = database.ref('leaderboard');
    leaderboardRef.orderByChild('score').limitToLast(10).once('value', (snapshot) => {
        let leaderboard = [];
        snapshot.forEach((childSnapshot) => {
            leaderboard.push(childSnapshot.val());
        });
        leaderboard.reverse();
        leaderboardList.innerHTML = '';
        leaderboard.forEach(entry => {
            const li = document.createElement('li');
            li.textContent = `${entry.nickname}: ${entry.score}`;
            leaderboardList.appendChild(li);
        });
    });
}

// Call displayLeaderboard on page load
displayLeaderboard();

function checkWin() {
    const allCorrect = shapes.every(shapeObj => {
        if (shapeObj.placed) {
            const shapeRect = shapeObj.element.getBoundingClientRect();
            const targetCellRect = gameContainer.children[shapeObj.target].getBoundingClientRect();
            return shapeRect.left === targetCellRect.left && shapeRect.top === targetCellRect.top;
        }
        return false;
    });

    if (allCorrect && expectedTargetOrder > shapes.length) {
        level++;
        levelDisplay.textContent = `Level: ${level}`;
        totalTime += 30;

        const levelPoints = 20 * (2 ** (level - 2));
        if (level === 1) {
            levelPoints = 20;
        }
        score += levelPoints;
        scoreDisplay.textContent = `Score: ${score}`;

        if (score >= 20) {
            const nickname = localStorage.getItem(`nickname-${currentUser}`) || 'Player';
            updateLeaderboard(nickname, score);
        }

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
    createGrid(); // Call createGrid AFTER getLevelData to use the obstacle information
    createShapesAndTargets(currentLevelData);
    hintUsed = false;
    hintButton.classList.remove('hint-disabled');
    hintButton.disabled = false;
}

function getLevelData(level) {
    let startLeft = 10;
    let startTop = 10;
    const spacing = 90;
    let numShapes = Math.min(level + 2, 9);
    const shapes = [];
    const targets = [];
    const obstacles = [];
    const colors = ['lightblue', 'lightgreen', 'lightcoral', 'yellow', 'orange', 'purple', 'cyan', 'pink', 'brown', 'gray', 'olive', 'teal', 'indigo', 'violet', 'gold', 'silver', 'salmon', 'coral', 'khaki', 'lavender', 'lime', 'maroon', 'blue', 'red', 'green', 'navy', 'crimson', 'forestgreen', 'goldenrod', 'darkorange', 'mediumpurple', 'skyblue', 'firebrick', 'seagreen', 'darkgoldenrod', 'peru', 'thistle'];
    const usedColors = [];
    const usedTargets = [];
    const usedObstacles = [];
    const gridSize = 25;

    const rowThreshold = 5;
    const numObstacles = Math.floor(level / 2);

    for (let i = 0; i < numObstacles; i++) {
        let obstacleIndex;
        do {
            obstacleIndex = Math.floor(Math.random() * gridSize);
        } while (usedObstacles.includes(obstacleIndex) || usedTargets.includes(obstacleIndex));
        obstacles.push(obstacleIndex);
        usedObstacles.push(obstacleIndex);
    }

    for (let i = 0; i < numShapes; i++) {
        let color, targetIndex;
        do {
            targetIndex = Math.floor(Math.random() * gridSize);
        } while (usedTargets.includes(targetIndex) || usedObstacles.includes(targetIndex));
        usedTargets.push(targetIndex);

        let shapeLeft = startLeft;
        let shapeTop = startTop;

        if (i >= rowThreshold) {
            shapeLeft = startLeft + (gameContainer.offsetWidth / 2);
            shapeTop = startTop + ((i - rowThreshold) * spacing);
        } else {
            shapeTop = startTop + (i * spacing);
        }

        shapes.push({
            color: color = colors[Math.floor(Math.random() * colors.length)],
            startLeft: `${shapeLeft}px`,
            startTop: `${shapeTop}px`,
            target: targetIndex, // Store the target index
            order: i + 1 // Assign sequential order
        });
        targets.push(targetIndex); // Keep track of target indices
    }

    return { shapes: shapes, targets: targets, obstacles: obstacles };
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
    score = 0;
    scoreDisplay.textContent = `Score: ${score}`;
    levelDisplay.textContent = `Level: ${level}`;
    timerDisplay.textContent = 'Time: 1:00';
    clearInterval(timerInterval);
    gameContainer.innerHTML = '';
    hintUsed = false;
    hintButton.classList.remove('hint-disabled');
    hintButton.disabled = false;
    resetButton.disabled = false;
    pauseButton.disabled = false;
    startGame();
}