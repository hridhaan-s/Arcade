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

// ── MUSIC PLAYER ──
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

const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const songName = document.getElementById('songName');
const volumeSlider = document.getElementById('volumeSlider');

function loadTrack(index) {
    audio.src = playlist[index].file;
    songName.textContent = playlist[index].name;
    if (isPlaying) audio.play();
}

function togglePlay() {
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        playBtn.textContent = '▶';
    } else {
        audio.play();
        isPlaying = true;
        playBtn.textContent = '⏸';
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

audio.addEventListener('ended', nextTrack);
volumeSlider.addEventListener('input', () => { audio.volume = volumeSlider.value; });
playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);
loadTrack(0);

// ── PATH SELECTOR ──
window.selectPath = function(path) {
    document.getElementById('clubBtn').classList.remove('active');
    document.getElementById('individualBtn').classList.remove('active');
    document.getElementById('clubContent').classList.remove('active');
    document.getElementById('individualContent').classList.remove('active');

    if (path === 'club') {
        document.getElementById('clubBtn').classList.add('active');
        document.getElementById('clubContent').classList.add('active');
    } else {
        document.getElementById('individualBtn').classList.add('active');
        document.getElementById('individualContent').classList.add('active');
    }

    setTimeout(() => {
        document.getElementById(path + 'Content').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }, 100);
}

// Navbar Actions

document.getElementById("navWorkshop")?.addEventListener("click", (e) => {
    e.preventDefault();

    selectPath("club");

    document.getElementById("clubContent").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});

document.getElementById("navSubmit")?.addEventListener("click", (e) => {
    e.preventDefault();

    selectPath("individual");

    document.getElementById("individualContent").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});


const popup = document.getElementById("updatePopup");

if(localStorage.getItem("arcadePopupClosed")){
    popup.style.display = "none";
}

document
.getElementById("closePopupBtn")
?.addEventListener("click", () => {

    popup.style.display = "none";

    localStorage.setItem(
        "arcadePopupClosed",
        "true"
    );

});