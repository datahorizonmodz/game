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
    const TILE_SIZE = 10; 
    const NORMAL_SPEED = 1.5; 
    const BOOST_SPEED = 4.5; 
    
    // Konfigurasi Buah
    const MAX_NORMAL_FOOD = 5000; // Jumlah Buah Normal (Apple, Strawberry, Semangka, Pisang)
    const MAX_SPECIAL_FOOD = 1000; // Jumlah Buah Spesial (Anggur)
    const NORMAL_FOOD_POINT = 50; // Skor untuk buah normal
    const SPECIAL_FOOD_POINT = 150; // Skor untuk Anggur (sesuai permintaan)
    const GROWTH_PER_FOOD = 10;
    const FOOD_SIZE = TILE_SIZE * 2; 

    // Konfigurasi NPC
    const NPC_COUNT = 800; // Jumlah NPC (disesuaikan agar lebih banyak)


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
    
    // --- STATUS INPUT DESKTOP BARU ---
    let isKeyPressed = false; // Untuk WASD/Panah
    let mousePosition = { x: 0, y: 0 }; // Untuk kontrol mouse
    const activeKeys = new Set(); // Melacak tombol WASD/Panah yang sedang ditekan
    // -----------------------------------


    // Leaderboard Dummy
    let leaderboardData = [
        { name: 'Datzon', score: 5000 },
        { name: 'Alex', score: 4200 },
        { name: 'Bryan', score: 3100 },
        { name: 'Kira', score: 2600 }
    ];

    // --- Link Gambar Dummy Buah & Konfigurasi Spesial ---
    const fruitImages = {
        apple: new Image(),
        strawberry: new Image(),
        watermelon: new Image(),
        banana: new Image(),
        grape: new Image()
    };
    
    // Menerapkan Link Gambar Baru (Blogger)
    fruitImages.apple.src = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhz2lbPdFu35fGqG28J3hXwgw9K16s8AB5_DXAvUpqHrl5jTeug40hK0PWb4NZxmia8koxMxa8Mp9CY9lQiKrP-4ww1DBEvvEUl3qReLAJc-eHrbSvLgektE6TKf8VcYjiWWvqiH7hEUjUSdzybcnU5F5VmQmdVbJ6qtUOekHctQSvTnmMOZ3t88ZvFOZeu/s2560/quality_restoration_20251104100309133.png';
    fruitImages.strawberry.src = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiBBLQyrJAXQjsq_5WUb4ERYwBTfxbDe7tAVxMAwaof_jXI9sv_7EpME6UIJqGVb3T-GmDOIBwf30dyXRMSoo97ye0BTpyK-1gto4BJfEfLSuQxRev1Fk18-4WRfQJBSGYhH0ArEtYCj3a6CwWe-kBPO3SQczbJs3IBbTvX6pOegE9i-7OqadwAhJK8aefF/s2560/quality_restoration_20251104100401287.png';
    fruitImages.watermelon.src = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhvWesDNUDbi4zfp7AZAOJqypLsi50pR0_D9jupDYd5rXNVuwlo2ydkQ1ASxbnoq7Tkl4a9xJBHQOpQGFG6GenUIJY2tRXmeTZ9qe5Muc99o_y_PXA4W_Zgjvn1WdgyDHUhoCgfWOfw9uGSCQNrZL5frRJA8SGjjZ1A9AztyOGluf7PmcZyaCtwkTUEkZMGD/s2560/quality_restoration_20251104100731738.png';
    fruitImages.banana.src = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgn9wRw7fhpL1SuTHzwk4kxO0WOVTdjwOFxDLF5uvsNzLjK2jlqoOFV32Qd-pb12NQkfmAwjLi3g5AAugElIKf1b2Mf2P9d22Iu3gDwbCs2chNZcAhfWRJNJi2Qrb45RmD7sQCcMsFX7w9gTa1GLc8BYdSHeoviq_j-iZQuoAmtlKTI4v40BqI_u34typH0/s2560/quality_restoration_20251104100452661.png';
    fruitImages.grape.src = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgmafDuKMcfOj6gMoIcdg9AzmEtqndD7nhWxfsuQeogHRueCncO9gOjMEKgLPM1EncbDEgP9d83pt34sdwMj8rK86GYatrF31DRbG3PLJ4UALov2xhwpy-KdaBBChrwpflPmgWu72U9_Addcbq5OiMTVGA5v8H-WFPHTs6n18aUx8kg-BA7rK6HnH3DcIPM/s2560/quality_restoration_20251104100609973.png';
    
    // Daftar tipe buah
    const NORMAL_FRUIT_TYPES = ['apple', 'strawberry', 'watermelon', 'banana'];
    const SPECIAL_FRUIT_TYPE = 'grape';


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

            // Dapatkan posisi Kepala
            const head = this.segments[this.segments.length - 1];
            const headX = head.x + offsetX;
            const headY = head.y + offsetY;
            
            // Dapatkan posisi Ekor
            const tail = this.segments[0];
            const tailX = tail.x + offsetX;
            const tailY = tail.y + offsetY;


            // 1. Gambar Tubuh Ular
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = TILE_SIZE;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Garis tubuh
            ctx.moveTo(tailX, tailY);
            for (let i = 1; i < this.segments.length; i++) {
                ctx.lineTo(this.segments[i].x + offsetX, this.segments[i].y + offsetY);
            }
            ctx.stroke();

            
            // 2. Implementasi Ekor Lancip (Hanya untuk segmen terakhir/terdepan)
            if (this.segments.length > 1) {
                const secondToLast = this.segments[1];
                const dx = tailX - (secondToLast.x + offsetX);
                const dy = tailY - (secondToLast.y + offsetY);
                const angleTail = Math.atan2(dy, dx); // Arah ekor

                ctx.save();
                ctx.translate(tailX, tailY);
                ctx.rotate(angleTail);

                ctx.fillStyle = this.color;
                ctx.beginPath();
                // Buat segitiga yang meruncing ke belakang
                ctx.moveTo(TILE_SIZE / 2, 0); // Puncak
                ctx.lineTo(-TILE_SIZE * 0.5, TILE_SIZE / 2); // Kaki bawah
                ctx.lineTo(-TILE_SIZE * 0.5, -TILE_SIZE / 2); // Kaki atas
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            }


            // 3. Gambar Kepala (Di atas tubuh)
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(headX, headY, TILE_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();


            // 4. Detail Visual (Hanya untuk Ular Pemain)
            if (this.isPlayer) {
                
                // --- Mata ---
                const eyeRadius = TILE_SIZE * 0.15;
                const pupilRadius = TILE_SIZE * 0.08;
                const eyeOffset = TILE_SIZE * 0.25; // Jarak dari pusat kepala

                // Mata Putih (Offset ke samping dan depan)
                // Sudut tegak lurus dari arah gerak (+/- Math.PI / 2)
                const perpAngle = this.angle + Math.PI / 2; 

                // Mata Kiri
                const eye1X = headX + Math.cos(perpAngle) * eyeOffset;
                const eye1Y = headY + Math.sin(perpAngle) * eyeOffset;
                // Mata Kanan
                const eye2X = headX + Math.cos(perpAngle - Math.PI) * eyeOffset; // Sudut berlawanan
                const eye2Y = headY + Math.sin(perpAngle - Math.PI) * eyeOffset; 

                // Gambar Mata Putih
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2);
                ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2);
                ctx.fill();

                // Gambar Pupil Hitam (di tengah mata putih)
                ctx.fillStyle = 'black';
                ctx.beginPath();
                ctx.arc(eye1X, eye1Y, pupilRadius, 0, Math.PI * 2);
                ctx.arc(eye2X, eye2Y, pupilRadius, 0, Math.PI * 2);
                ctx.fill();


                // --- Lidah ---
                const time = Date.now() / 100; // Untuk animasi
                const tongueLength = TILE_SIZE * 1.5;
                const tongueSpread = TILE_SIZE * 0.25;
                const tongueMovement = (Math.sin(time) > 0) ? TILE_SIZE * 0.1 : 0; // Lidah menjulur/masuk

                const tongueBaseX = headX + Math.cos(this.angle) * (TILE_SIZE / 2); // Pangkal lidah
                const tongueBaseY = headY + Math.sin(this.angle) * (TILE_SIZE / 2);

                const tongueTipX = tongueBaseX + Math.cos(this.angle) * (tongueLength + tongueMovement);
                const tongueTipY = tongueBaseY + Math.sin(this.angle) * (tongueLength + tongueMovement);

                ctx.fillStyle = 'red';
                ctx.beginPath();
                // Garis dari pangkal ke ujung garpu kanan
                ctx.moveTo(tongueBaseX, tongueBaseY);
                ctx.lineTo(
                    tongueTipX + Math.cos(perpAngle) * tongueSpread, 
                    tongueTipY + Math.sin(perpAngle) * tongueSpread
                );
                // Garis ke ujung garpu kiri
                ctx.lineTo(
                    tongueTipX + Math.cos(perpAngle - Math.PI) * tongueSpread, 
                    tongueTipY + Math.sin(perpAngle - Math.PI) * tongueSpread
                );
                // Garis kembali ke pangkal
                ctx.closePath();
                ctx.fill();
            }
        }

        grow(amount) {
            this.length += amount;
        }

        // Cek tabrakan dengan radius (untuk buah)
        checkCollision(point, radius = TILE_SIZE / 2) {
            const head = this.segments[this.segments.length - 1];
            const dx = head.x - point.x;
            const dy = head.y - point.y;
            return Math.sqrt(dx * dx + dy * dy) < TILE_SIZE + radius; 
        }

        // Cek tabrakan dengan tubuh ular lain
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
    
    // *** FUNGSI BARU: SPAWN BUAH NORMAL DAN SPESIAL ***
    function spawnFood(count = 1) {
        for (let i = 0; i < count; i++) {
            const isSpecial = Math.random() < 0.1 && getFoodCount(SPECIAL_FRUIT_TYPE) < MAX_SPECIAL_FOOD; // 10% chance untuk special food

            let type;
            if (isSpecial) {
                type = SPECIAL_FRUIT_TYPE;
            } else if (getFoodCount() < MAX_NORMAL_FOOD) {
                type = NORMAL_FRUIT_TYPES[Math.floor(Math.random() * NORMAL_FRUIT_TYPES.length)];
            } else {
                continue; // Jangan spawn jika batas maksimum tercapai
            }

            foods.push({
                x: Math.random() * MAP_WIDTH,
                y: Math.random() * MAP_HEIGHT,
                type: type,
                score: (type === SPECIAL_FRUIT_TYPE) ? SPECIAL_FOOD_POINT : NORMAL_FOOD_POINT
            });
        }
    }

    function getFoodCount(type = null) {
        if (type) {
            return foods.filter(f => f.type === type).length;
        }
        return foods.filter(f => NORMAL_FRUIT_TYPES.includes(f.type)).length;
    }
    
    function initialSpawnFood() {
        // Spawn Buah Normal secara awal
        spawnFood(MAX_NORMAL_FOOD); 
        // Spawn Buah Spesial (misalnya 10 buah awal)
        for(let i = 0; i < 10; i++) {
            foods.push({
                x: Math.random() * MAP_WIDTH,
                y: Math.random() * MAP_HEIGHT,
                type: SPECIAL_FRUIT_TYPE,
                score: SPECIAL_FOOD_POINT
            });
        }
    }
    // *************************************************

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
        initialSpawnFood(); // Gunakan initialSpawnFood baru
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
        
        // --- LOGIKA KONTROL DESKTOP ---
        if (isDragging) {
            // Priority 1: Joystick/Touch (Sudut diatur di handleMove)
            isKeyPressed = false; // Nonaktifkan keyboard saat joystick aktif
        } else if (isKeyPressed) {
            // Priority 2: Keyboard WASD/Panah (Sudut diatur di keydown)
            // Lanjutkan menggunakan sudut yang dihitung dari input keyboard
        } else {
            // Priority 3: Mouse Movement (Hanya jika tidak ada input lain aktif)
            // Hitung arah ke kursor mouse
            const canvasRect = canvas.getBoundingClientRect();
            const centerX = canvas.width / 2; // Pusat Canvas
            const centerY = canvas.height / 2;
            
            // Konversi koordinat mouse ke koordinat relatif canvas
            const mouseX = mousePosition.x - canvasRect.left;
            const mouseY = mousePosition.y - canvasRect.top;

            const dx = mouseX - centerX;
            const dy = mouseY - centerY;
            
            // Atur sudut ular berdasarkan mouse
            playerSnake.angle = Math.atan2(dy, dx);
        }
        // -----------------------------


        playerSnake.update();
        updateCamera();
        scoreDisplay.textContent = `Skor: ${score}`;

        npcSNAKES.forEach(npc => npc.update());

        // Cek Makan Buah
        for (let i = foods.length - 1; i >= 0; i--) {
            const food = foods[i];
            if (playerSnake.checkCollision(food, FOOD_SIZE / 2)) { 
                foods.splice(i, 1);
                playerSnake.grow(GROWTH_PER_FOOD); 
                score += food.score; // Ambil skor dari objek buah
                
                // Spawn buah pengganti (1 buah)
                spawnFood(1);
            }
        }

        // Cek Tabrakan Ular (Pemain vs NPC)
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
        
        // Cek jika jumlah buah spesial berkurang, tambahkan lagi
        if (getFoodCount(SPECIAL_FRUIT_TYPE) < MAX_SPECIAL_FOOD) {
             spawnFood(1); 
        }
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
            // Karena gambar dari blogger mungkin butuh waktu loading
            if (img.complete) { 
                ctx.drawImage(img, food.x + offsetX - FOOD_SIZE / 2, food.y + offsetY - FOOD_SIZE / 2, FOOD_SIZE, FOOD_SIZE);
            } else {
                // Fallback (lingkaran warna)
                ctx.fillStyle = (food.type === 'grape') ? 'purple' : 'green';
                ctx.beginPath();
                ctx.arc(food.x + offsetX, food.y + offsetY, FOOD_SIZE / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Gambar NPC dan Ular Pemain (memanggil draw() yang sudah dimodifikasi)
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

    // [Kode Joystick dan Boost tetap sama...]
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


    // --- KONTROL DESKTOP (MOUSE & KEYBOARD) BARU ---
    
    // 1. Listener Mouse (Untuk Kontrol Arah)
    canvas.addEventListener('mousemove', (e) => {
        // Simpan posisi mouse global
        mousePosition.x = e.clientX; 
        mousePosition.y = e.clientY;
    });


    // 2. Listener Keyboard (WASD, Panah, SPACE)
    const KEY_MAP = {
        // Sudut dalam radian (0 = Kanan/D, -PI/2 = Atas/W, PI/2 = Bawah/S, PI = Kiri/A)
        'w': -Math.PI / 2, 'W': -Math.PI / 2, 'ArrowUp': -Math.PI / 2,
        's': Math.PI / 2, 'S': Math.PI / 2, 'ArrowDown': Math.PI / 2,
        'a': Math.PI, 'A': Math.PI, 'ArrowLeft': Math.PI,
        'd': 0, 'D': 0, 'ArrowRight': 0,
    };
    
    window.addEventListener('keydown', (e) => {
        if (gameState !== 'playing' || !playerSnake.isAlive) return;
        
        const key = e.key;

        // A. Tombol Boost (SPACE)
        if (key === ' ' && !e.repeat) { 
            e.preventDefault();
            playerSnake.isBoosting = true;
        }

        // B. Tombol Arah (WASD / Panah)
        if (KEY_MAP.hasOwnProperty(key)) {
            e.preventDefault();
            activeKeys.add(key);
            isKeyPressed = true; // Set flag input keyboard aktif
            
            // Menghitung Sudut Gabungan untuk 8 Arah
            let angle = 0;
            
            const hasUp = activeKeys.has('w') || activeKeys.has('W') || activeKeys.has('ArrowUp');
            const hasDown = activeKeys.has('s') || activeKeys.has('S') || activeKeys.has('ArrowDown');
            const hasLeft = activeKeys.has('a') || activeKeys.has('A') || activeKeys.has('ArrowLeft');
            const hasRight = activeKeys.has('d') || activeKeys.has('D') || activeKeys.has('ArrowRight');

            if (hasUp && hasRight) { angle = -Math.PI / 4; }         // Atas Kanan
            else if (hasUp && hasLeft) { angle = -3 * Math.PI / 4; }  // Atas Kiri
            else if (hasDown && hasRight) { angle = Math.PI / 4; }   // Bawah Kanan
            else if (hasDown && hasLeft) { angle = 3 * Math.PI / 4; } // Bawah Kiri
            else if (hasUp) { angle = -Math.PI / 2; }                // Atas
            else if (hasDown) { angle = Math.PI / 2; }               // Bawah
            else if (hasLeft) { angle = Math.PI; }                   // Kiri
            else if (hasRight) { angle = 0; }                        // Kanan
            
            playerSnake.angle = angle;
        }
    });

    window.addEventListener('keyup', (e) => {
        if (gameState !== 'playing' || !playerSnake.isAlive) return;
        
        const key = e.key;

        // A. Tombol Boost (SPACE)
        if (key === ' ') {
            playerSnake.isBoosting = false;
        }

        // B. Tombol Arah (WASD / Panah)
        if (KEY_MAP.hasOwnProperty(key)) {
            activeKeys.delete(key);
            
            if (activeKeys.size === 0) {
                isKeyPressed = false; // Nonaktifkan flag jika semua tombol dilepas
            } else {
                // Panggil keydown untuk menghitung ulang sudut (misal, dari W+D menjadi hanya W)
                const remainingKey = Array.from(activeKeys)[0];
                window.dispatchEvent(new KeyboardEvent('keydown', { key: remainingKey }));
            }
        }
    });
    // ----------------------------------------------------


    resizeCanvas();
});