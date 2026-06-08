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

// ── MUSIC PLAYER WITH RETRO AUDIO MATRIX VISUALIZER ──
const playlist = [
    { file: 'slimeyfox-arcade-80s-era-481352 (2).mp3', name: 'Arcade (80s Era)' },
    { file: 'enemy_instrumental.mp3', name: 'Enemy (Instrumental)' },
    { file: 'interstellar_ringtone (1).mp3', name: 'Interstellar' },
    { file: 'NO BATIDO.mp3', name: 'No Batido' },
    { file: 'jhol_mixed_version.mp3', name: 'Jhol (Mixed)' }
];

let currentTrack = 0;
let isPlaying = false;
const audio = new Audio();
audio.volume = 0.7;

// Web Audio API Elements
let audioContext;
let analyzer;
let dataArray;
let sourceNode;
let isAudioContextInitialized = false;

const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const songName = document.getElementById('songName');
const volumeSlider = document.getElementById('volumeSlider');
const matrixCanvas = document.getElementById('audioMatrix');
let matrixCtx = matrixCanvas ? matrixCanvas.getContext('2d') : null;

// Safe Initialization Engine for Audio Analysis Nodes
function initAudioAnalyzer() {
    if (isAudioContextInitialized) return; // Prevent double creation crash

    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyzer = audioContext.createAnalyser();
        
        // Lower fftSize creates wider, chunky, retro-style bars (16 bars total)
        analyzer.fftSize = 32; 
        
        const bufferLength = analyzer.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        // Wire the HTML Audio node into our script graph nodes
        sourceNode = audioContext.createMediaElementSource(audio);
        sourceNode.connect(analyzer);
        analyzer.connect(audioContext.destination);
        
        isAudioContextInitialized = true;
        
        // Start matrix frame loop render
        drawMatrix();
    } catch (e) {
        console.warn("Web Audio API matrix mapping bypassed:", e);
    }
}

function loadTrack(index) {
    if (!playlist[index]) return;
    audio.src = playlist[index].file;
    if (songName) songName.textContent = playlist[index].name;
    if (isPlaying) {
        audio.play().catch(err => console.log("Audio play interrupted:", err));
    }
}

function togglePlay() {
    // Wake up context nodes if browser paused them, or spin up fresh
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    } else {
        initAudioAnalyzer();
    }

    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        if (playBtn) playBtn.textContent = '▶';
    } else {
        audio.play().then(() => {
            isPlaying = true;
            if (playBtn) playBtn.textContent = '⏸';
        }).catch(err => console.log("Audio context play blocked:", err));
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

// ── MATRIX CANVAS RENDER ANIMATION LOOP ──
function drawMatrix() {
    if (!matrixCtx || !analyzer) return;

    requestAnimationFrame(drawMatrix);
    
    // Extract dynamic frequency changes from active decibel range arrays
    analyzer.getByteFrequencyData(dataArray);
    
    const width = matrixCanvas.width;
    const height = matrixCanvas.height;
    
    // Creates a neon persistence-of-vision trailing blur by drawing opaque squares over history frames
    matrixCtx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    matrixCtx.fillRect(0, 0, width, height);
    
    const barCount = analyzer.frequencyBinCount;
    const barWidth = (width / barCount) - 2;
    let x = 0;

    for (let i = 0; i < barCount; i++) {
        const percent = dataArray[i] / 255;
        const barHeight = percent * height;
        
        // Retro-Futuristic Rainbow: Modulating HSL spectrum offsets
        matrixCtx.fillStyle = `hsl(${250 + (i * 8)}, 100%, 60%)`;
        
        // Draw each column box starting at bottom container threshold bound
        matrixCtx.fillRect(x, height - barHeight, barWidth, barHeight);
        
        x += barWidth + 2;
    }
}

audio.addEventListener('ended', nextTrack);

if (volumeSlider) {
    volumeSlider.addEventListener('input', () => { audio.volume = volumeSlider.value; });
}
if (playBtn) playBtn.addEventListener('click', togglePlay);
if (nextBtn) nextBtn.addEventListener('click', nextTrack);
if (prevBtn) prevBtn.addEventListener('click', prevTrack);

// Boot first metadata profile state
loadTrack(0);

// Global Exporter Hook so your main start Arcade switch can initialize this as well
window.forceStartMusicWithMatrix = function() {
    initAudioAnalyzer();
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
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
