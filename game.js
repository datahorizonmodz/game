document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen DOM ---
    const startScreen = document.getElementById('start-screen');
    const gameContainer = document.getElementById('game-container');
    const gameOverScreen = document.getElementById('game-over-screen');
    const playButton = document.getElementById('play-button');
    const restartButton = document.getElementById('restart-button');
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
    const joystickHandle = document.getElementById('joystick-handle');
    const joystickRegion = document.getElementById('joystick-region');

    // --- Konfigurasi Game ---
    const TILE_SIZE = 10;
    const SPEED = 2.5; // Kecepatan gerak (per frame)
    const MAX_FOOD = 20;
    const NPC_COUNT = 5;

    // Data Game
    let gameState = 'start'; // 'start', 'playing', 'gameover'
    let playerName = 'Pemain';
    let playerColor = '#00FF00';
    let score = 0;
    let animationFrameId;

    // Objek Game
    let playerSnake;
    let foods = [];
    let npcSNAKES = [];

    // Objek Joystick
    let isDragging = false;
    let joystickCenter = { x: 0, y: 0 };
    let joystickRadius = 50; // Radius dasar joystick (sesuai CSS)

    // Leaderboard Dummy
    let leaderboardData = [
        { name: 'Datzon', score: 5000 },
        { name: 'Alex', score: 4200 },
        { name: 'Bryan', score: 3100 },
        { name: 'Kira', score: 2600 }
    ];

    // Dummy Image URLs (untuk buah)
    const fruitImages = {
        apple: 'https://via.placeholder.com/20/FF0000?text=A', // Merah
        banana: 'https://via.placeholder.com/20/FFFF00?text=B', // Kuning
        strawberry: 'https://via.placeholder.com/20/FF4500?text=S' // Oranye-Merah
    };
    const fruitTypes = ['apple', 'banana', 'strawberry'];

    // --- Kelas Game (Snake) ---
    class Snake {
        constructor(x, y, color, isPlayer = false, initialLength = 50) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.isPlayer = isPlayer;
            this.segments = []; // Bagian tubuh ular
            this.direction = { x: 0, y: 0 }; // Arah gerak (vektor)
            this.angle = Math.random() * Math.PI * 2; // Arah acak awal (dalam radian)
            this.speed = isPlayer ? SPEED : SPEED * 0.8;
            this.isAlive = true;
            this.length = initialLength;
            this.segments.push({ x: x, y: y });

            if (!isPlayer) {
                this.name = this.generateRandomName();
            }
        }

        generateRandomName() {
            const names = ['Viper', 'Kobra', 'Python', 'Rattler', 'Slinky', 'Hiss'];
            return names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 99);
        }

        update() {
            if (!this.isAlive) return;

            // Update arah dari angle
            this.direction.x = Math.cos(this.angle) * this.speed;
            this.direction.y = Math.sin(this.angle) * this.speed;

            // Gerak
            this.x += this.direction.x;
            this.y += this.direction.y;

            // Batasan Peta (Wrap Around)
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            if (this.y > canvas.height) this.y = 0;

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

        draw() {
            if (!this.isAlive) return;

            // Gambar tubuh
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = TILE_SIZE;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Garis tubuh
            ctx.moveTo(this.segments[0].x, this.segments[0].y);
            for (let i = 1; i < this.segments.length; i++) {
                ctx.lineTo(this.segments[i].x, this.segments[i].y);
            }
            ctx.stroke();

            // Gambar kepala (di segmen terakhir)
            const head = this.segments[this.segments.length - 1];
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(head.x, head.y, TILE_SIZE / 2, 0, Math.PI * 2);
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
            // Radius tabrakan: TILE_SIZE (kepala ular) + radius buah/titik
            return Math.sqrt(dx * dx + dy * dy) < TILE_SIZE;
        }

        // Cek tabrakan dengan tubuh ular lain (termasuk dirinya)
        checkBodyCollision(otherSnake, isSelfCollision = false) {
            const head = this.segments[this.segments.length - 1];
            const startIndex = isSelfCollision ? Math.floor(this.length * 0.7) : 0; // Abaikan 70% segmen depan sendiri

            for (let i = startIndex; i < otherSnake.segments.length - 5; i += 5) { // Cek setiap 5 segmen
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

        // Update joystick center
        const rect = joystickBase.getBoundingClientRect();
        joystickCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        joystickRadius = rect.width / 2;
    }

    function spawnFood(count) {
        for (let i = 0; i < count; i++) {
            foods.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                type: fruitTypes[Math.floor(Math.random() * fruitTypes.length)]
            });
        }
    }

    function spawnNpcSnakes() {
        npcSNAKES = [];
        for (let i = 0; i < NPC_COUNT; i++) {
            const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            npcSNAKES.push(new Snake(x, y, randomColor));
        }
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

        // Inisialisasi Game
        resizeCanvas();
        playerSnake = new Snake(canvas.width / 2, canvas.height / 2, playerColor, true, 100);
        playerSnake.angle = -Math.PI / 2; // Arah awal ke atas
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
        gameState = 'gameover';
        
        // Update Leaderboard
        const playerScoreEntry = { name: playerName, score: score };
        const finalLeaderboard = [...leaderboardData, playerScoreEntry]
            .sort((a, b) => b.score - a.score)
            .slice(0, 5); // Ambil 5 teratas
        
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
        gameContainer.style.display = 'none';

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    }

    // --- Loop Game ---

    function update() {
        if (gameState !== 'playing') return;

        // 1. Update Ular Pemain
        playerSnake.update();
        scoreDisplay.textContent = `Skor: ${score}`;

        // 2. Update NPC
        npcSNAKES.forEach(npc => npc.update());

        // 3. Cek Makan Buah
        for (let i = foods.length - 1; i >= 0; i--) {
            const food = foods[i];
            if (playerSnake.checkCollision(food)) {
                foods.splice(i, 1);
                playerSnake.grow(10); // Tumbuh sedikit
                score += 10;
                spawnFood(1); // Ganti buah yang dimakan
            }
        }

        // 4. Cek Tabrakan Ular (Pemain vs NPC)
        for (let i = npcSNAKES.length - 1; i >= 0; i--) {
            const npc = npcSNAKES[i];
            
            // Pemain menabrak NPC
            if (playerSnake.checkBodyCollision(npc, false)) {
                gameOver();
                return;
            }

            // NPC menabrak Pemain
            if (npc.checkBodyCollision(playerSnake, false)) {
                // NPC mati, Pemain dapat skor
                npcSNAKES.splice(i, 1);
                score += Math.floor(npc.length / 2); // Skor berdasarkan panjang NPC
                playerSnake.grow(Math.floor(npc.length / 4)); // Tumbuh dari sisa NPC
                
                // Spawn NPC baru setelah delay
                setTimeout(() => {
                    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
                    const x = Math.random() * canvas.width;
                    const y = Math.random() * canvas.height;
                    npcSNAKES.push(new Snake(x, y, randomColor));
                }, 5000); // Muncul lagi setelah 5 detik
            }
        }
    }

    function draw() {
        // Hapus Canvas
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Gambar Buah (simulasi gambar dengan lingkaran warna)
        foods.forEach(food => {
            let color;
            switch (food.type) {
                case 'apple': color = 'red'; break;
                case 'banana': color = 'yellow'; break;
                case 'strawberry': color = 'orange'; break;
            }
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(food.x, food.y, TILE_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();
            // Catatan: Karena menggunakan link dummy, kita hanya menggambar lingkaran warna sederhana.
            // Jika Anda ingin gambar, Anda perlu memuat objek Image di sini.
        });

        // Gambar NPC
        npcSNAKES.forEach(npc => npc.draw());

        // Gambar Ular Pemain (terakhir agar di atas semua)
        playerSnake.draw();
    }

    function gameLoop() {
        update();
        draw();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // --- Input dan Event Listeners ---

    // 1. Play & Restart Button
    playButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);
    window.addEventListener('resize', resizeCanvas);

    // 2. Joystick Virtual (Touch Events)

    // Dapatkan posisi pusat joystick saat start
    function getJoystickCenter() {
        const rect = joystickBase.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    // Event Mulai Touch
    joystickRegion.addEventListener('touchstart', (e) => {
        if (gameState !== 'playing') return;
        e.preventDefault();
        isDragging = true;
        joystickCenter = getJoystickCenter(); // Pastikan pusat diperbarui
        joystickRadius = joystickBase.clientWidth / 2;
        handleMove(e.touches[0]);
    });

    // Event Gerak Touch
    joystickRegion.addEventListener('touchmove', (e) => {
        if (gameState !== 'playing' || !isDragging) return;
        e.preventDefault();
        handleMove(e.touches[0]);
    });

    // Event Akhir Touch
    joystickRegion.addEventListener('touchend', (e) => {
        if (gameState !== 'playing') return;
        isDragging = false;
        // Kembalikan handle ke tengah
        joystickHandle.style.transform = `translate(-50%, -50%)`;
        playerSnake.direction = { x: 0, y: 0 }; // Ular berhenti
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
        const angle = Math.atan2(dy, dx);
        playerSnake.angle = angle;
        
        // Set kecepatan ular agar bergerak
        playerSnake.direction.x = Math.cos(angle) * playerSnake.speed;
        playerSnake.direction.y = Math.sin(angle) * playerSnake.speed;
    }

});