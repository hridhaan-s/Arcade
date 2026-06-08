import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

console.log("Arcade loaded 🎮");

// ── THREE.JS ──
const canvas = document.getElementById('controller-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
camera.position.set(0, 1, 5);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const purpleLight = new THREE.PointLight(0x5B23FF, 80, 20);
purpleLight.position.set(-3, 3, 3);
scene.add(purpleLight);

const blueLight = new THREE.PointLight(0x008BFF, 60, 20);
blueLight.position.set(3, -2, 3);
scene.add(blueLight);

const limeLight = new THREE.PointLight(0xE4FF30, 40, 15);
limeLight.position.set(0, -3, 2);
scene.add(limeLight);

const loader = new GLTFLoader();
let controller;

loader.load(
    'controller.glb',
    (gltf) => {
        controller = gltf.scene;
        const box = new THREE.Box3().setFromObject(controller);
        const center = box.getCenter(new THREE.Vector3());
        controller.position.sub(center);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        controller.scale.setScalar(1.8 / maxDim);
        scene.add(controller);
        console.log("Controller loaded ✅");
    },
    null,
    (error) => console.error("Error:", error)
);

let isDragging = false;
let prevMouseX = 0, prevMouseY = 0;
let rotX = 0, rotY = 0;

canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
    canvas.style.cursor = 'grabbing';
});

window.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.style.cursor = 'grab';
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    rotY += (e.clientX - prevMouseX) * 0.01;
    rotX += (e.clientY - prevMouseY) * 0.01;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
});

canvas.style.cursor = 'grab';
let colorT = 0;

function animate() {
    requestAnimationFrame(animate);
    colorT += 0.02;
    if (controller) {
        if (!isDragging) rotY += 0.008;
        controller.rotation.y = rotY;
        controller.rotation.x = rotX;
        controller.position.y = Math.sin(Date.now() * 0.001) * 0.1;
    }
    purpleLight.color.setHSL((colorT * 0.1) % 1, 1, 0.5);
    blueLight.color.setHSL((colorT * 0.1 + 0.3) % 1, 1, 0.5);
    limeLight.color.setHSL((colorT * 0.1 + 0.6) % 1, 1, 0.5);
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
});

// ── MUSIC PLAYER WITH AUTOMATIC RETRO MATRIX VISUALIZER ──
const playlist = [
    { file: 'slimeyfox-arcade-80s-era-481352 (2).mp3', name: 'Arcade (80s Era)' },
    { file: 'enemy_instrumental.mp3', name: 'Enemy (Instrumental)' },
    { file: 'interstellar_ringtone (1).mp3', name: 'Interstellar' },
    { file: 'NO BATIDO.mp3', name: 'No Batido' },
    { file: 'jhol_mixed_version.mp3', name: 'Jhol (Mixed)' }
];

let currentTrack = 0;
let isPlaying = false;

const audio = document.getElementById('arcadeAudio') || new Audio(); 
audio.volume = 0.7;

const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const songName = document.getElementById('songName');
const volumeSlider = document.getElementById('volumeSlider');
const matrixCanvas = document.getElementById('audioMatrix');
let matrixCtx = matrixCanvas ? matrixCanvas.getContext('2d') : null;

function loadTrack(index) {
    if (!playlist[index]) return;
    audio.src = playlist[index].file;
    if (songName) songName.textContent = playlist[index].name;
    if (isPlaying) {
        audio.play().catch(err => console.log("Audio play interrupted:", err));
    }
}

function togglePlay() {
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        if (playBtn) playBtn.textContent = '▶';
    } else {
        audio.play().then(() => {
            isPlaying = true;
            if (playBtn) playBtn.textContent = '⏸';
        }).catch(err => console.log("Playback blocked:", err));
    }
}

function nextTrack() {
    currentTrack = (currentTrack + 1) % playlist.length;
    loadTrack(currentTrack);
}

function prevTrack() {
    currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrack);
}

// ── AUTOMATIC MATRIX RENDER ENGINE ──
let waveTime = 0;

function drawMatrixLoop() {
    if (!matrixCtx || !matrixCanvas) return;
    requestAnimationFrame(drawMatrixLoop);

    const width = matrixCanvas.width;
    const height = matrixCanvas.height;

    // Smooth trail cleanup layer
    matrixCtx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    matrixCtx.fillRect(0, 0, width, height);

    const barCount = 16; 
    const barWidth = (width / barCount) - 1.5;
    let x = 0;

    // Locked default behaviors
    const defaultFxSpeed = 5;       // Smooth wave animation pacing
    const defaultBaseHue = 340;     // Starts at hot neon pink/magenta

    if (isPlaying) {
        waveTime += 0.08 * (defaultFxSpeed * 0.3);
    }

    for (let i = 0; i < barCount; i++) {
        let barHeight = 2; // Flat idle line threshold

        if (isPlaying) {
            // Rhythmic arcade tracking waves
            const sineA = Math.sin(i * 0.5 + waveTime);
            const sineB = Math.cos(i * 0.2 - waveTime * 1.3);
            const randomJitter = Math.random() * 0.25; 

            const compositeWave = Math.abs(sineA + sineB) / 2 + randomJitter;
            barHeight = compositeWave * (height - 4) + 2;
        }

        // Standardized color gradient mapping (Shifts beautifully from Pink to Orange/Yellow)
        const elementHue = (defaultBaseHue + (i * 4)) % 360;
        matrixCtx.fillStyle = `hsl(${elementHue}, 100%, 60%)`;

        matrixCtx.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth + 1.5;
    }
}

// Kick off drawing loop immediately
drawMatrixLoop();

audio.addEventListener('ended', nextTrack);

if (volumeSlider) {
    volumeSlider.addEventListener('input', () => { audio.volume = volumeSlider.value; });
}
if (playBtn) playBtn.addEventListener('click', togglePlay);
if (nextBtn) nextBtn.addEventListener('click', nextTrack);
if (prevBtn) prevBtn.addEventListener('click', prevTrack);

loadTrack(0);

window.forceStartMusicWithMatrix = function() {
    if (!isPlaying) {
        audio.play().then(() => {
            isPlaying = true;
            if (playBtn) playBtn.textContent = '⏸';
        }).catch(err => console.log("Audio boot skipped:", err));
    }
};

// Initial initialization of track data
loadTrack(0);

// ── PATH SELECTOR ──
window.selectPath = function(path) {
    const clubBtn = document.getElementById('clubBtn');
    const individualBtn = document.getElementById('individualBtn');
    const clubContent = document.getElementById('clubContent');
    const individualContent = document.getElementById('individualContent');

    if (clubBtn) clubBtn.classList.remove('active');
    if (individualBtn) individualBtn.classList.remove('active');
    if (clubContent) clubContent.classList.remove('active');
    if (individualContent) individualContent.classList.remove('active');

    if (path === 'club') {
        if (clubBtn) clubBtn.classList.add('active');
        if (clubContent) clubContent.classList.add('active');
    } else {
        if (individualBtn) individualBtn.classList.add('active');
        if (individualContent) individualContent.classList.add('active');
    }

    const targetContent = document.getElementById(path + 'Content');
    if (targetContent) {
        setTimeout(() => {
            targetContent.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    }
}

// Navbar Actions
document.getElementById("navWorkshop")?.addEventListener("click", (e) => {
    e.preventDefault();
    selectPath("club");
    document.getElementById("clubContent")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});

document.getElementById("navSubmit")?.addEventListener("click", (e) => {
    e.preventDefault();
    selectPath("individual");
    document.getElementById("individualContent")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});

// Update Popup Handlers
const popup = document.getElementById("updatePopup");
if (popup) {
    if (localStorage.getItem("arcadePopupClosed")) {
        popup.style.display = "none";
    }
    document.getElementById("closePopupBtn")?.addEventListener("click", () => {
        popup.style.display = "none";
        localStorage.setItem("arcadePopupClosed", "true");
    });
}

// Glitch Visual Effects
setInterval(() => {
    const title = document.querySelector(".arcade-title");
    if (!title) return;
    title.classList.add("glitch");
    setTimeout(() => {
        title.classList.remove("glitch");
    }, 120);
}, 4000);

function glitchScreen() {
    document.body.classList.add("screen-glitch");
    setTimeout(() => {
        document.body.classList.remove("screen-glitch");
    }, 150);
}

setInterval(() => {
    if (Math.random() > 0.7) {
        glitchScreen();
    }
}, 20000);

const bar = document.getElementById("glitchBar");
if (bar) {
    setInterval(() => {
        bar.style.top = Math.random() * window.innerHeight + "px";
        bar.style.opacity = 1;
        setTimeout(() => {
            bar.style.opacity = 0;
        }, 100);
    }, 7000);
}

const messages = [
    "INSERT COIN",
    "PLAYER ONE READY",
    "LEVEL 1",
    "BONUS STAGE",
    "ARCADE ONLINE"
];

// ── CONSOLIDATED START SCREEN & AUDIO AUTOSTART EVENT ──
const startBtn = document.getElementById("startArcade");
const readyScreen = document.getElementById("readyScreen");

if (startBtn && readyScreen) {
    startBtn.addEventListener("click", () => {
        // 1. Button Press Scale Effect
        startBtn.style.transform = "scale(0.95)";
        
        // 2. Play the background track instantly 
        if (!isPlaying) {
            audio.play().then(() => {
                isPlaying = true;
                if (playBtn) playBtn.textContent = '⏸';
            }).catch(err => console.log("Audio play request failed:", err));
        }

        // 3. Fire Launch Animation Class
        readyScreen.classList.add("launching");

        // 4. Smooth Transition out & clean up node elements
        setTimeout(() => {
            readyScreen.style.transition = "opacity 0.8s ease";
            readyScreen.style.opacity = "0";

            setTimeout(() => {
                readyScreen.remove();
            }, 800);
        }, 500);
    });
}


// ── NATIVE CABINET GAME ENGINE: SPACE INVADERS ──
const gameCanvas = document.getElementById("miniGameCanvas");
const gameCtx = gameCanvas ? gameCanvas.getContext("2d") : null;

if (gameCanvas && gameCtx) {
    // Game State Variables
    let playerWidth = 30;
    let playerHeight = 15;
    let playerX = (gameCanvas.width - playerWidth) / 2;
    const playerY = gameCanvas.height - 30;

    let lasers = [];
    let laserSpeed = 6;
    let lastShotTime = 0;
    const fireRateLimit = 250; // Delay in milliseconds between laser shots

    let invaders = [];
    const invaderRows = 4;
    const invaderCols = 6;
    const invaderWidth = 24;
    const invaderHeight = 16;
    const invaderPadding = 14;
    const invaderOffsetTop = 50;
    const invaderOffsetLeft = 35;

    let invaderDirection = 1; // 1 = right, -1 = left
    let invaderSpeed = 0.8;
    let invaderDropDistance = 10;

    let gameScore = 0;
    let gameOver = false;
    let gameWon = false;

    // Build the grid of enemy invaders
    function initInvaders() {
        invaders = [];
        for (let c = 0; c < invaderCols; c++) {
            invaders[c] = [];
            for (let r = 0; r < invaderRows; r++) {
                // Different row colors for retro vibe
                let hue = 180 + (r * 40); 
                invaders[c][r] = { x: 0, y: 0, active: true, hue: hue };
            }
        }
    }

    // Capture controls (Move ship with mouse pointer)
    document.addEventListener("mousemove", (e) => {
        const rect = gameCanvas.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;
        if (relativeX > 0 && relativeX < gameCanvas.width) {
            playerX = relativeX - playerWidth / 2;
        }
    });

    // Tap or Click to shoot lasers
    gameCanvas.addEventListener("click", () => {
        const currentTime = Date.now();
        if (currentTime - lastShotTime > fireRateLimit && !gameOver && !gameWon) {
            lasers.push({ x: playerX + playerWidth / 2 - 2, y: playerY, w: 3, h: 10 });
            lastShotTime = currentTime;
        } else if (gameOver || gameWon) {
            // Restart game on click if it's over
            gameScore = 0;
            invaderSpeed = 0.8;
            gameOver = false;
            gameWon = false;
            lasers = [];
            initInvaders();
        }
    });

    // Reset everything initially
    initInvaders();

    // Main Engine Update & Render Loop
    function updateGameLoop() {
        requestAnimationFrame(updateGameLoop);

        // Clear view with retro deep navy space background
        gameCtx.fillStyle = "#0b0d19";
        gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

        // Render HUD text display
        gameCtx.font = "8px 'Press Start 2P', monospace";
        gameCtx.fillStyle = "#ffffff";
        gameCtx.fillText(`SCORE: ${gameScore}`, 15, 25);

        if (gameOver) {
            gameCtx.fillStyle = "#ff6074";
            gameCtx.fillText("GAME OVER", gameCanvas.width / 2 - 45, gameCanvas.height / 2);
            gameCtx.fillStyle = "#ffffff";
            gameCtx.fillText("CLICK TO RESTART", gameCanvas.width / 2 - 75, gameCanvas.height / 2 + 20);
            return;
        }

        if (gameWon) {
            gameCtx.fillStyle = "#E4FF30";
            gameCtx.fillText("VICTORY!", gameCanvas.width / 2 - 40, gameCanvas.height / 2);
            gameCtx.fillStyle = "#ffffff";
            gameCtx.fillText("CLICK FOR NEXT WAVE", gameCanvas.width / 2 - 85, gameCanvas.height / 2 + 20);
            return;
        }

        // 1. DRAW PLAYER SHIP (Pixel Art block)
        gameCtx.fillStyle = "#2cd4bc";
        gameCtx.fillRect(playerX, playerY, playerWidth, playerHeight);
        gameCtx.fillRect(playerX + playerWidth / 2 - 4, playerY - 4, 8, 4); // Cannon nozzle

        // 2. MOVE AND DRAW LASERS
        gameCtx.fillStyle = "#ff2a74";
        for (let i = lasers.length - 1; i >= 0; i--) {
            lasers[i].y -= laserSpeed;
            gameCtx.fillRect(lasers[i].x, lasers[i].y, lasers[i].w, lasers[i].h);

            // Strip out dead lasers hitting top border wall boundaries
            if (lasers[i].y < 0) {
                lasers.splice(i, 1);
            }
        }

        // 3. MOVE AND DRAW INVADER ARMADA
        let changeDirection = false;
        let activeCount = 0;

        for (let c = 0; c < invaderCols; c++) {
            for (let r = 0; r < invaderRows; r++) {
                let inv = invaders[c][r];
                if (inv.active) {
                    activeCount++;
                    // Map positions on grid coordinates
                    inv.x = (c * (invaderWidth + invaderPadding)) + invaderOffsetLeft + (invaderDirection * invaderSpeed);
                    inv.y = (r * (invaderHeight + invaderPadding)) + invaderOffsetTop;

                    // Hit visual limits on layout walls?
                    if (inv.x + invaderWidth > gameCanvas.width - 15 || inv.x < 15) {
                        changeDirection = true;
                    }

                    // Check if enemies breached defense threshold lines
                    if (inv.y + invaderHeight >= playerY) {
                        gameOver = true;
                    }

                    // Draw the individual alien cube
                    gameCtx.fillStyle = `hsl(${inv.hue}, 100%, 60%)`;
                    gameCtx.fillRect(inv.x, inv.y, invaderWidth, invaderHeight);
                    // Add tiny neon core eyes inside the blocks
                    gameCtx.fillStyle = "#000000";
                    gameCtx.fillRect(inv.x + 4, inv.y + 4, 3, 3);
                    gameCtx.fillRect(inv.x + invaderWidth - 7, inv.y + 4, 3, 3);

                    // 4. CHECK COLLISION (Lasers hitting alien invaders)
                    for (let l = lasers.length - 1; l >= 0; l--) {
                        let lx = lasers[l].x;
                        let ly = lasers[l].y;

                        if (lx > inv.x && lx < inv.x + invaderWidth && ly > inv.y && ly < inv.y + invaderHeight) {
                            inv.active = false;
                            lasers.splice(l, 1);
                            gameScore += 10;
                            break;
                        }
                    }
                }
            }
        }

        // Handle dropping down lines when hitting boundaries
        if (changeDirection) {
            invaderDirection *= -1;
            invaderOffsetLeft += invaderDirection * 4; // Shift base offset positioning safely
            for (let c = 0; c < invaderCols; c++) {
                for (let r = 0; r < invaderRows; r++) {
                    invaders[c][r].y += invaderDropDistance;
                }
            }
            invaderOffsetTop += invaderDropDistance;
        }

        // All clean? Wipe check condition
        if (activeCount === 0) {
            gameWon = true;
            invaderSpeed += 0.4; // Accelerate enemy parameters on subsequent drops
        }
    }

    // Trigger frame updates
    updateGameLoop();
}