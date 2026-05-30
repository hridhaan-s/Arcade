import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

console.log("Arcade loaded 🎮");

// ── THREE.JS CONTROLLER ──
const canvas = document.getElementById('controller-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
camera.position.set(0, 1, 5);

// Lighting
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

// Load GLB
const loader = new GLTFLoader();
let controller;

loader.load(
    'controller.glb',
    (gltf) => {
        controller = gltf.scene;

        // Center the model
        const box = new THREE.Box3().setFromObject(controller);
        const center = box.getCenter(new THREE.Vector3());
        controller.position.sub(center);

        // Scale to fit
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.8 / maxDim;
        controller.scale.setScalar(scale);

        scene.add(controller);
        console.log("Controller loaded ✅");
    },
    (progress) => {
        console.log("Loading:", (progress.loaded / progress.total * 100).toFixed(0) + "%");
    },
    (error) => {
        console.error("Error loading model:", error);
    }
);

// ── DRAG TO ROTATE ──
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
    const dx = e.clientX - prevMouseX;
    const dy = e.clientY - prevMouseY;
    rotY += dx * 0.01;
    rotX += dy * 0.01;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
});

// Touch support
canvas.addEventListener('touchstart', (e) => {
    isDragging = true;
    prevMouseX = e.touches[0].clientX;
    prevMouseY = e.touches[0].clientY;
});

window.addEventListener('touchend', () => {
    isDragging = false;
});

window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - prevMouseX;
    const dy = e.touches[0].clientY - prevMouseY;
    rotY += dx * 0.01;
    rotX += dy * 0.01;
    prevMouseX = e.touches[0].clientX;
    prevMouseY = e.touches[0].clientY;
});

// Set grab cursor
canvas.style.cursor = 'grab';

// RGB light animation
let colorT = 0;

// ── ANIMATE ──
function animate() {
    requestAnimationFrame(animate);
    colorT += 0.02;

    if (controller) {
        // Auto rotate when not dragging
        if (!isDragging) {
            rotY += 0.008;
        }
        controller.rotation.y = rotY;
        controller.rotation.x = rotX;
        // Floating effect
        controller.position.y = Math.sin(Date.now() * 0.001) * 0.1;
    }

    // Animate RGB lights
    purpleLight.color.setHSL((colorT * 0.1) % 1, 1, 0.5);
    blueLight.color.setHSL((colorT * 0.1 + 0.3) % 1, 1, 0.5);
    limeLight.color.setHSL((colorT * 0.1 + 0.6) % 1, 1, 0.5);

    renderer.render(scene, camera);
}
animate();

// ── RESIZE ──
window.addEventListener('resize', () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
});