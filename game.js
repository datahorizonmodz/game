document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen DOM ---
    const startScreen = document.getElementById('start-screen');
    const gameContainer = document.getElementById('game-container');
    const gameOverScreen = document.getElementById('game-over-screen');
    const playButton = document.getElementById('play-button');
    const restartButton = document.getElementById('restart-button');
    const homeButton = document.getElementById('home-button');
    const boostButton = document.getElementById('boost-button');
    const usernameInput = document.getElementById('username-input');
    const colorPicker = document.getElementById('color-picker');
    const scoreDisplay = document.getElementById('score-display');
    const playerNameDisplay = document.getElementById('player-name-display');
    const finalScoreDisplay = document.getElementById('final-score');
    const leaderboardList = document.getElementById('leaderboard');

    // Canvas
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    // Joystick
    const joystickBase = document.getElementById('joystick-base');
    const joystickRegion = document.getElementById('joystick-region');
    const joystickHandle = document.getElementById('joystick-handle');

    // --- Konfigurasi Game Baru ---
    const MAP_WIDTH = 5000; 
    const MAP_HEIGHT = 5000;
    const TILE_SIZE = 10; // Ukuran dasar elemen game (ular, buah)
    const NORMAL_SPEED = 1.5; 
    const BOOST_SPEED = 4.5; 
    const MAX_FOOD = 20000; // Jumlah buah (disesuaikan agar lebih banyak)
    const NPC_COUNT = 2000; // Jumlah NPC (disesuaikan agar lebih banyak)
    const FOOD_SIZE = TILE_SIZE * 2; // Ukuran buah agar lebih terlihat

    // Data Game
    let gameState = 'start';
    let playerName = 'Pemain';
    let playerColor = '#00FF00';
    let score = 0;
    let animationFrameId;
    let cameraX = 0;
    let cameraY = 0;

    // Objek Game
    let playerSnake;
    let foods = [];
    let npcSNAKES = [];

    // Objek Joystick
    let isDragging = false;
    let joystickCenter = { x: 0, y: 0 };
    let joystickRadius = 50; 

    // Leaderboard Dummy
    let leaderboardData = [
        { name: 'Datzon', score: 5000 },
        { name: 'Alex', score: 4200 },
        { name: 'Bryan', score: 3100 },
        { name: 'Kira', score: 2600 }
    ];

    // --- Link Gambar Dummy Buah ---
    const fruitImages = {
        apple: new Image(),
        banana: new Image(),
        strawberry: new Image()
    };
    fruitImages.apple.src = 'https://i.imgur.com/kS55l1s.png'; // Contoh: Apple (ukuran kecil)
    fruitImages.banana.src = 'https://i.imgur.com/c6B19G0.png'; // Contoh: Banana
    fruitImages.strawberry.src = 'https://i.imgur.com/lM3N2f1.png'; // Contoh: Strawberry

    // Jika link di atas tidak bekerja, coba link dummy lain dari placeholder:
    // fruitImages.apple.src = 'https://via.placeholder.com/30/FF0000/FFFFFF?text=🍎';
    // fruitImages.banana.src = 'https://via.placeholder.com/30/FFFF00/000000?text=🍌';
    // fruitImages.strawberry.src = 'https://via.placeholder.com/30/FF4500/FFFFFF?text=🍓';
    
    const fruitTypes = ['apple', 'banana', 'strawberry'];

    // --- Kelas Game (Snake) ---
    class Snake {
        constructor(x, y, color, isPlayer = false, initialLength = 100) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.isPlayer = isPlayer;
            this.segments = [];
            this.direction = { x: 0, y: 0 }; 
            this.angle = isPlayer ? -Math.PI / 2 : Math.random() * Math.PI * 2;
            this.speed = isPlayer ? NORMAL_SPEED : NORMAL_SPEED * 0.8;
            this.isAlive = true;
            this.length = initialLength;
            this.isBoosting = false;
            this.segments.push({ x: x, y: y });

            if (!isPlayer) {
                this.name = this.generateRandomName();
            }
        }

        generateRandomName() {
            const names = ['Viper', 'Kobra', 'Python', 'Rattler', 'Slinky', 'Hiss', 'Shadow'];
            return names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 99);
        }

        update() {
            if (!this.isAlive) return;

            if (this.isPlayer) {
                this.speed = this.isBoosting ? BOOST_SPEED : NORMAL_SPEED;
            }

            this.direction.x = Math.cos(this.angle) * this.speed;
            this.direction.y = Math.sin(this.angle) * this.speed;

            this.x += this.direction.x;
            this.y += this.direction.y;

            // Tabrakan Border (Keluar Peta) -> Mati
            if (this.x < 0 || this.x > MAP_WIDTH || this.y < 0 || this.y > MAP_HEIGHT) {
                this.isAlive = false;
                if (this.isPlayer) {
                    gameOver();
                }
                return;
            }

            this.segments.push({ x: this.x, y: this.y });

            while (this.segments.length > this.length) {
                this.segments.shift();
            }

            if (!this.isPlayer && Math.random() < 0.02) {
                this.angle += (Math.random() - 0.5) * 0.5;
            }
        }

        draw(cameraX, cameraY) {
            if (!this.isAlive) return;

            const offsetX = -cameraX;
            const offsetY = -cameraY;

            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = TILE_SIZE;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.moveTo(this.segments[0].x + offsetX, this.segments[0].y + offsetY);
            for (let i = 1; i < this.segments.length; i++) {
                ctx.lineTo(this.segments[i].x + offsetX, this.segments[i].y + offsetY);
            }
            ctx.stroke();

            const head = this.segments[this.segments.length - 1];
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(head.x + offsetX, head.y + offsetY, TILE_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        grow(amount) {
            this.length += amount;
        }

        checkCollision(point, radius = TILE_SIZE / 2) { // Tambah radius untuk cek tabrakan
            const head = this.segments[this.segments.length - 1];
            const dx = head.x - point.x;
            const dy = head.y - point.y;
            return Math.sqrt(dx * dx + dy * dy) < TILE_SIZE + radius; // Ukuran tabrakan disesuaikan
        }

        checkBodyCollision(otherSnake, isSelfCollision = false) {
            const head = this.segments[this.segments.length - 1];
            const startIndex = isSelfCollision ? Math.floor(this.length * 0.7) : 0; 

            for (let i = startIndex; i < otherSnake.segments.length - 5; i += 5) {
                const segment = otherSnake.segments[i];
                const dx = head.x - segment.x;
                const dy = head.y - segment.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < TILE_SIZE) {
                    return true;
                }
            }
            return false;
        }
    }

    // --- Fungsi Game Umum ---

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function getJoystickCenter() {
        const rect = joystickBase.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    function spawnFood(count) {
        for (let i = 0; i < count; i++) {
            foods.push({
                x: Math.random() * MAP_WIDTH,
                y: Math.random() * MAP_HEIGHT,
                type: fruitTypes[Math.floor(Math.random() * fruitTypes.length)]
            });
        }
    }

    function spawnNpcSnakes() {
        npcSNAKES = [];
        for (let i = 0; i < NPC_COUNT; i++) {
            const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
            const x = Math.random() * MAP_WIDTH;
            const y = Math.random() * MAP_HEIGHT;
            npcSNAKES.push(new Snake(x, y, randomColor, false, 50 + Math.random() * 50));
        }
    }

    function goToStartScreen() {
        gameOverScreen.style.display = 'none';
        gameContainer.style.display = 'none';
        startScreen.style.display = 'flex';
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        gameState = 'start';
    }

    function startGame() {
        gameState = 'playing';
        playerName = usernameInput.value || 'Pemain';
        playerColor = colorPicker.value;
        score = 0;

        startScreen.style.display = 'none';
        gameContainer.style.display = 'block';
        gameOverScreen.style.display = 'none';
        playerNameDisplay.textContent = playerName;
        resizeCanvas();

        playerSnake = new Snake(MAP_WIDTH / 2, MAP_HEIGHT / 2, playerColor, true, 100);
        
        foods = [];
        spawnFood(MAX_FOOD);
        spawnNpcSnakes();

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        gameLoop();
    }

    function gameOver() {
        if (gameState !== 'playing') return;
        
        gameState = 'gameover';
        
        const playerScoreEntry = { name: playerName, score: score };
        const finalLeaderboard = [...leaderboardData.filter(item => item.name !== playerName), playerScoreEntry]
            .sort((a, b) => b.score - a.score)
            .slice(0, 5); 
        
        leaderboardList.innerHTML = '';
        finalLeaderboard.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `${index + 1}. ${item.name} <span>${item.score}</span>`;
            if (item.name === playerName && item.score === score) {
                li.classList.add('player-score');
            }
            leaderboardList.appendChild(li);
        });

        finalScoreDisplay.textContent = score;
        gameOverScreen.style.display = 'flex';

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    }

    function spawnNewNpc(npc) {
        setTimeout(() => {
            const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
            const x = Math.random() * MAP_WIDTH;
            const y = Math.random() * MAP_HEIGHT;
            const index = npcSNAKES.indexOf(npc);
            if (index !== -1) {
                 npcSNAKES[index] = new Snake(x, y, randomColor, false, 50 + Math.random() * 50);
            }
        }, 5000); 
    }

    // --- Loop Game ---

    function updateCamera() {
        let targetX = playerSnake.x - canvas.width / 2;
        let targetY = playerSnake.y - canvas.height / 2;

        targetX = Math.max(0, Math.min(targetX, MAP_WIDTH - canvas.width));
        targetY = Math.max(0, Math.min(targetY, MAP_HEIGHT - canvas.height));

        const smoothing = 0.1;
        cameraX += (targetX - cameraX) * smoothing;
        cameraY += (targetY - cameraY) * smoothing;
    }

    function update() {
        if (gameState !== 'playing' || !playerSnake.isAlive) return;

        playerSnake.update();
        updateCamera();
        scoreDisplay.textContent = `Skor: ${score}`;

        npcSNAKES.forEach(npc => npc.update());

        for (let i = foods.length - 1; i >= 0; i--) {
            const food = foods[i];
            // Cek tabrakan dengan ukuran buah
            if (playerSnake.checkCollision(food, FOOD_SIZE / 2)) { 
                foods.splice(i, 1);
                playerSnake.grow(10); 
                score += 10;
                spawnFood(1);
            }
        }

        for (let i = npcSNAKES.length - 1; i >= 0; i--) {
            const npc = npcSNAKES[i];
            if (!npc.isAlive) continue;

            if (playerSnake.checkBodyCollision(npc, false)) {
                gameOver();
                return;
            }

            if (npc.checkBodyCollision(playerSnake, false)) {
                npc.isAlive = false;
                score += Math.floor(npc.length / 2);
                playerSnake.grow(Math.floor(npc.length / 4));
                spawnNewNpc(npc);
            }
        }

        npcSNAKES = npcSNAKES.filter(npc => {
            if (!npc.isAlive && !npc.isPlayer) {
                spawnNewNpc(npc);
                return false;
            }
            return true;
        });
    }

    function draw() {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const offsetX = -cameraX;
        const offsetY = -cameraY;

        ctx.strokeStyle = '#555';
        ctx.lineWidth = 10;
        ctx.strokeRect(0 + offsetX, 0 + offsetY, MAP_WIDTH, MAP_HEIGHT);
        
        // --- Gambar Buah (menggunakan gambar dummy) ---
        foods.forEach(food => {
            const img = fruitImages[food.type];
            if (img.complete) { // Pastikan gambar sudah dimuat
                ctx.drawImage(img, food.x + offsetX - FOOD_SIZE / 2, food.y + offsetY - FOOD_SIZE / 2, FOOD_SIZE, FOOD_SIZE);
            } else {
                // Fallback jika gambar belum dimuat (gambar lingkaran sementara)
                let color;
                switch (food.type) {
                    case 'apple': color = 'red'; break;
                    case 'banana': color = 'yellow'; break;
                    case 'strawberry': color = 'orange'; break;
                }
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(food.x + offsetX, food.y + offsetY, FOOD_SIZE / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        npcSNAKES.forEach(npc => npc.draw(cameraX, cameraY));

        if (playerSnake.isAlive) {
            playerSnake.draw(cameraX, cameraY);
        }
    }

    function gameLoop() {
        update();
        draw();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // --- Input dan Event Listeners ---
    playButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);
    homeButton.addEventListener('click', goToStartScreen);
    window.addEventListener('resize', resizeCanvas);

    joystickRegion.addEventListener('touchstart', (e) => {
        if (gameState !== 'playing') return;
        e.preventDefault();
        isDragging = true;
        joystickCenter = getJoystickCenter(); 
        joystickRadius = joystickBase.clientWidth / 2;
        handleMove(e.touches[0]);
    });

    joystickRegion.addEventListener('touchmove', (e) => {
        if (gameState !== 'playing' || !isDragging) return;
        e.preventDefault();
        handleMove(e.touches[0]);
    });

    joystickRegion.addEventListener('touchend', (e) => {
        if (gameState !== 'playing') return;
        isDragging = false;
        joystickHandle.style.transform = `translate(-50%, -50%)`;
    });

    boostButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameState === 'playing' && playerSnake.isAlive) {
            playerSnake.isBoosting = true;
        }
    });

    boostButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (gameState === 'playing' && playerSnake.isAlive) {
            playerSnake.isBoosting = false;
        }
    });

    function handleMove(touch) {
        let dx = touch.clientX - joystickCenter.x;
        let dy = touch.clientY - joystickCenter.y;
        
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > joystickRadius) {
            const angle = Math.atan2(dy, dx);
            dx = Math.cos(angle) * joystickRadius;
            dy = Math.sin(angle) * joystickRadius;
        }

        joystickHandle.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

        playerSnake.angle = Math.atan2(dy, dx);
    }

    resizeCanvas();
});
