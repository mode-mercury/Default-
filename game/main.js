import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155/build/three.module.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0d8f0);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(3, 3, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// simple low poly ground
const groundGeom = new THREE.ConeGeometry(2, 1, 6);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x55aa55, flatShading: true });
const ground = new THREE.Mesh(groundGeom, groundMat);
scene.add(ground);

// central low poly tower
const towerGeom = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8);
const towerMat = new THREE.MeshStandardMaterial({ color: 0x888888, flatShading: true });
const tower = new THREE.Mesh(towerGeom, towerMat);
tower.position.y = 0.75;
scene.add(tower);

// light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);

function animate() {
  requestAnimationFrame(animate);
  ground.rotation.y += 0.002;
  tower.rotation.y -= 0.003;
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
