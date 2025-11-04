document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen DOM ---
    const startScreen = document.getElementById('start-screen');
    const gameContainer = document.getElementById('game-container');
    const gameOverScreen = document.getElementById('game-over-screen');
    const playButton = document.getElementById('play-button');
    const restartButton = document.getElementById('restart-button');
    const homeButton = document.getElementById('home-button'); // Tombol HOME baru
    const boostButton = document.getElementById('boost-button'); // Tombol BOOST baru
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
    const MAP_WIDTH = 5000; // Peta besar (5000x5000 piksel)
    const MAP_HEIGHT = 5000;
    const TILE_SIZE = 10;
    const NORMAL_SPEED = 1.5; // Kecepatan normal (dikurangi)
    const BOOST_SPEED = 4.5; // Kecepatan boost
    const MAX_FOOD = 500; // Lebih banyak makanan untuk map besar
    const NPC_COUNT = 50; 

    // Data Game
    let gameState = 'start';
    let playerName = 'Pemain';
    let playerColor = '#00FF00';
    let score = 0;
    let animationFrameId;
    let cameraX = 0; // Posisi kamera (offset X)
    let cameraY = 0; // Posisi kamera (offset Y)

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

    // Dummy Image URLs (untuk buah)
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
            this.isBoosting = false; // Hanya untuk player
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

            // Update kecepatan untuk pemain (termasuk boost)
            if (this.isPlayer) {
                this.speed = this.isBoosting ? BOOST_SPEED : NORMAL_SPEED;
            }

            // Update arah dari angle
            this.direction.x = Math.cos(this.angle) * this.speed;
            this.direction.y = Math.sin(this.angle) * this.speed;

            // Gerak
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

            // Tambahkan kepala baru
            this.segments.push({ x: this.x, y: this.y });

            // Hapus ekor lama untuk menjaga panjang
            while (this.segments.length > this.length) {
                this.segments.shift();
            }

            // NPC Logic: Random turn (simpel)
            if (!this.isPlayer && Math.random() < 0.02) {
                this.angle += (Math.random() - 0.5) * 0.5; // Belok sedikit
            }
        }

        draw(cameraX, cameraY) {
            if (!this.isAlive) return;

            // Offset koordinat dengan kamera
            const offsetX = -cameraX;
            const offsetY = -cameraY;

            // Gambar tubuh
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = TILE_SIZE;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Garis tubuh (diaplikasikan offset kamera)
            ctx.moveTo(this.segments[0].x + offsetX, this.segments[0].y + offsetY);
            for (let i = 1; i < this.segments.length; i++) {
                ctx.lineTo(this.segments[i].x + offsetX, this.segments[i].y + offsetY);
            }
            ctx.stroke();

            // Gambar kepala (di segmen terakhir)
            const head = this.segments[this.segments.length - 1];
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(head.x + offsetX, head.y + offsetY, TILE_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        grow(amount) {
            this.length += amount;
        }

        // Cek tabrakan dengan titik lain (untuk buah atau kepala ular lain)
        checkCollision(point) {
            const head = this.segments[this.segments.length - 1];
            const dx = head.x - point.x;
            const dy = head.y - point.y;
            return Math.sqrt(dx * dx + dy * dy) < TILE_SIZE;
        }

        // Cek tabrakan dengan tubuh ular lain (termasuk dirinya)
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

    // Mendapatkan posisi pusat joystick secara dinamis (penting untuk mobile)
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
        // Setup state
        gameState = 'playing';
        playerName = usernameInput.value || 'Pemain';
        playerColor = colorPicker.value;
        score = 0;

        // Setup UI
        startScreen.style.display = 'none';
        gameContainer.style.display = 'block';
        gameOverScreen.style.display = 'none';
        playerNameDisplay.textContent = playerName;
        resizeCanvas();

        // Inisialisasi Game
        // Posisikan pemain di tengah map
        playerSnake = new Snake(MAP_WIDTH / 2, MAP_HEIGHT / 2, playerColor, true, 100);
        
        foods = [];
        spawnFood(MAX_FOOD);
        spawnNpcSnakes();

        // Mulai Loop Game
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        gameLoop();
    }

    function gameOver() {
        if (gameState !== 'playing') return; // Cegah double game over
        
        gameState = 'gameover';
        
        // Update Leaderboard
        const playerScoreEntry = { name: playerName, score: score };
        const finalLeaderboard = [...leaderboardData.filter(item => item.name !== playerName), playerScoreEntry] // Hapus duplikat nama pemain
            .sort((a, b) => b.score - a.score)
            .slice(0, 5); 
        
        // Render Leaderboard
        leaderboardList.innerHTML = '';
        finalLeaderboard.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `${index + 1}. ${item.name} <span>${item.score}</span>`;
            if (item.name === playerName && item.score === score) {
                li.classList.add('player-score');
            }
            leaderboardList.appendChild(li);
        });

        // Tampilkan layar Game Over
        finalScoreDisplay.textContent = score;
        gameOverScreen.style.display = 'flex';

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    }

    function spawnNewNpc(npc) {
        // NPC mati, spawn yang baru setelah delay 5 detik
        setTimeout(() => {
            const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
            const x = Math.random() * MAP_WIDTH;
            const y = Math.random() * MAP_HEIGHT;
            // Ganti NPC yang mati dengan yang baru
            const index = npcSNAKES.indexOf(npc);
            if (index !== -1) {
                 npcSNAKES[index] = new Snake(x, y, randomColor, false, 50 + Math.random() * 50);
            }
        }, 5000); 
    }

    // --- Loop Game ---

    function updateCamera() {
        // Kamera berpusat pada pemain
        let targetX = playerSnake.x - canvas.width / 2;
        let targetY = playerSnake.y - canvas.height / 2;

        // Batasi kamera agar border peta selalu terlihat
        targetX = Math.max(0, Math.min(targetX, MAP_WIDTH - canvas.width));
        targetY = Math.max(0, Math.min(targetY, MAP_HEIGHT - canvas.height));

        // Animasi halus pergerakan kamera (optional)
        const smoothing = 0.1;
        cameraX += (targetX - cameraX) * smoothing;
        cameraY += (targetY - cameraY) * smoothing;
    }

    function update() {
        if (gameState !== 'playing' || !playerSnake.isAlive) return;

        // 1. Update Ular Pemain
        playerSnake.update();
        updateCamera(); // Update kamera setelah pemain bergerak
        scoreDisplay.textContent = `Skor: ${score}`;

        // 2. Update NPC
        npcSNAKES.forEach(npc => npc.update());

        // 3. Cek Makan Buah
        for (let i = foods.length - 1; i >= 0; i--) {
            const food = foods[i];
            if (playerSnake.checkCollision(food)) {
                foods.splice(i, 1);
                playerSnake.grow(10); 
                score += 10;
                spawnFood(1);
            }
        }

        // 4. Cek Tabrakan Ular (Pemain vs NPC)
        for (let i = npcSNAKES.length - 1; i >= 0; i--) {
            const npc = npcSNAKES[i];
            if (!npc.isAlive) continue;

            // Pemain menabrak NPC
            if (playerSnake.checkBodyCollision(npc, false)) {
                // Pemain kalah karena menabrak tubuh NPC
                gameOver();
                return;
            }

            // NPC menabrak Pemain
            if (npc.checkBodyCollision(playerSnake, false)) {
                // NPC mati, Pemain dapat skor
                npc.isAlive = false;
                score += Math.floor(npc.length / 2);
                playerSnake.grow(Math.floor(npc.length / 4));
                spawnNewNpc(npc); // Panggil respawn NPC
            }
        }

        // 5. Cleanup NPC yang mati karena border
        npcSNAKES = npcSNAKES.filter(npc => {
            if (!npc.isAlive && !npc.isPlayer) {
                // Respawn jika mati karena border
                spawnNewNpc(npc);
                return false;
            }
            return true;
        });
    }

    function draw() {
        // Hapus Canvas
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // --- Gambar Peta dengan Offset Kamera ---
        const offsetX = -cameraX;
        const offsetY = -cameraY;

        // Gambar Border Peta
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 10;
        ctx.strokeRect(0 + offsetX, 0 + offsetY, MAP_WIDTH, MAP_HEIGHT);
        
        // Gambar Buah (diaplikasikan offset kamera)
        foods.forEach(food => {
            let color;
            switch (food.type) {
                case 'apple': color = 'red'; break;
                case 'banana': color = 'yellow'; break;
                case 'strawberry': color = 'orange'; break;
            }
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(food.x + offsetX, food.y + offsetY, TILE_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Gambar NPC
        npcSNAKES.forEach(npc => npc.draw(cameraX, cameraY));

        // Gambar Ular Pemain
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
    homeButton.addEventListener('click', goToStartScreen); // Event Tombol HOME
    window.addEventListener('resize', resizeCanvas);

    // 2. Joystick Virtual (Touch Events)
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
        // Kembalikan handle ke tengah
        joystickHandle.style.transform = `translate(-50%, -50%)`;
        // Jangan hentikan arah, ular tetap bergerak lurus
        // playerSnake.direction = { x: 0, y: 0 }; 
    });

    // 3. Tombol Boost (Touch Events)
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


    // Logika Pergerakan Joystick
    function handleMove(touch) {
        let dx = touch.clientX - joystickCenter.x;
        let dy = touch.clientY - joystickCenter.y;
        
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Batasi pergerakan handle
        if (distance > joystickRadius) {
            const angle = Math.atan2(dy, dx);
            dx = Math.cos(angle) * joystickRadius;
            dy = Math.sin(angle) * joystickRadius;
        }

        // Pindahkan handle
        joystickHandle.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

        // Update arah ular
        playerSnake.angle = Math.atan2(dy, dx);
    }

    // Panggil resize awal
    resizeCanvas();
});
