import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { stations } from './stations.js';

const container = document.getElementById('scene-container');
const statusEl = document.getElementById('status');
const infoPanel = document.getElementById('station-info');
const stationNameEl = document.getElementById('station-name');
const stationLocationEl = document.getElementById('station-location');
const stationDescriptionEl = document.getElementById('station-description');
const visitSiteEl = document.getElementById('visit-site');
const playToggle = document.getElementById('play-toggle');
const closePanelButton = document.getElementById('close-panel');

const audio = new Audio();
audio.preload = 'none';
audio.crossOrigin = 'anonymous';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020617, 0.035);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 0, 6);
scene.add(camera);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableZoom = true;
controls.minDistance = 3.2;
controls.maxDistance = 9;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.rotateSpeed = 0.6;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.45;

const clock = new THREE.Clock();

const globeGroup = new THREE.Group();
scene.add(globeGroup);

const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load(
  'https://cdn.jsdelivr.net/gh/creativetimofficial/public-assets/soft-ui-dashboard-pro/assets/img/earth-dark.jpg'
);
const earthNormalMap = textureLoader.load(
  'https://cdn.jsdelivr.net/gh/creativetimofficial/public-assets/soft-ui-dashboard-pro/assets/img/earth-normal.jpg'
);
const earthSpecularMap = textureLoader.load(
  'https://cdn.jsdelivr.net/gh/creativetimofficial/public-assets/soft-ui-dashboard-pro/assets/img/earth-specular.png'
);

const radius = 2.2;
const globeGeometry = new THREE.SphereGeometry(radius, 128, 128);
const globeMaterial = new THREE.MeshStandardMaterial({
  map: earthTexture,
  normalMap: earthNormalMap,
  metalness: 0.2,
  roughness: 0.85,
  emissive: new THREE.Color('#082f49'),
  emissiveIntensity: 0.35,
  emissiveMap: earthSpecularMap
});
const globe = new THREE.Mesh(globeGeometry, globeMaterial);
globeGroup.add(globe);

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(radius * 1.08, 64, 64),
  new THREE.MeshBasicMaterial({
    color: new THREE.Color('#7df9ff'),
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.3
  })
);
globeGroup.add(atmosphere);

const haloGeometry = new THREE.RingGeometry(radius * 1.22, radius * 1.3, 128);
const haloMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color('#ff71c6'),
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.08
});
const halo = new THREE.Mesh(haloGeometry, haloMaterial);
halo.rotateX(Math.PI / 2);
globeGroup.add(halo);

const ambientLight = new THREE.AmbientLight(0x274060, 1.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0x9ad7ff, 1.3);
dirLight.position.set(5, 4, 2);
scene.add(dirLight);

const rimLight = new THREE.PointLight(0xff71c6, 0.75, 20);
rimLight.position.set(-6, -4, -2);
scene.add(rimLight);

const starGeometry = new THREE.BufferGeometry();
const starCount = 1500;
const starVertices = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i += 3) {
  const r = 35 + Math.random() * 40;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
  starVertices[i] = r * Math.sin(phi) * Math.cos(theta);
  starVertices[i + 1] = r * Math.sin(phi) * Math.sin(theta);
  starVertices[i + 2] = r * Math.cos(phi);
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starVertices, 3));
const stars = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({ color: 0x6b7280, size: 0.4, transparent: true, opacity: 0.6 })
);
scene.add(stars);

const markers = [];
const markerGeometry = new THREE.SphereGeometry(0.045, 16, 16);
const ringGeometry = new THREE.RingGeometry(0.06, 0.08, 32);
const pulseGeometry = new THREE.RingGeometry(0.07, 0.09, 32);

function latLngToVector3(lat, lng, r) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lng + 180);
  const x = -r * Math.sin(phi) * Math.cos(theta);
  const z = r * Math.sin(phi) * Math.sin(theta);
  const y = r * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

stations.forEach((station) => {
  const position = latLngToVector3(station.lat, station.lng, radius + 0.03);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ff71c6'),
    emissive: new THREE.Color('#ff71c6'),
    emissiveIntensity: 0.8
  });
  const marker = new THREE.Mesh(markerGeometry, material);
  marker.position.copy(position);
  marker.lookAt(position.clone().multiplyScalar(2));
  marker.userData.station = station;

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#7df9ff'),
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.position.copy(position);
  ring.lookAt(new THREE.Vector3());

  const pulseMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#7df9ff'),
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  });
  const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
  pulse.position.copy(position);
  pulse.lookAt(new THREE.Vector3());

  globeGroup.add(marker, ring, pulse);
  markers.push({
    mesh: marker,
    ring,
    pulse,
    station,
    hovered: false,
    targetScale: 1,
    currentScale: 1,
    targetOpacity: 0.6,
    currentOpacity: 0.6,
    pulseOffset: Math.random()
  });
});

const markerMeshes = markers.map((marker) => marker.mesh);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(2, 2);
let hoveredMarker = null;
let activeStation = null;
let isDragging = false;
let focusAnimation = null;

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function resize() {
  const { clientWidth, clientHeight } = container;
  renderer.setSize(clientWidth, clientHeight);
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
}

resize();
window.addEventListener('resize', resize);

function updatePointer(event) {
  const rect = container.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

container.addEventListener('pointerdown', () => {
  isDragging = false;
  focusAnimation = null;
});

container.addEventListener('pointermove', (event) => {
  if (event.buttons > 0 || event.pressure > 0) {
    isDragging = true;
  }
  updatePointer(event);
});

container.addEventListener('pointerup', (event) => {
  updatePointer(event);
  if (!isDragging) {
    selectMarker();
  }
});

container.addEventListener('pointerleave', () => {
  hoveredMarker = null;
  pointer.set(2, 2);
});

function setStatus(message) {
  statusEl.textContent = message;
}

function focusCameraOn(position) {
  const distance = controls.getDistance();
  const direction = position.clone().normalize();
  const target = direction.multiplyScalar(distance * 1.1);
  controls.autoRotate = false;
  focusAnimation = {
    start: camera.position.clone(),
    end: target,
    startTime: performance.now(),
    duration: 1600
  };
}

function revealPanel() {
  infoPanel.classList.remove('hidden');
}

function hidePanel() {
  infoPanel.classList.add('hidden');
  controls.autoRotate = true;
  focusAnimation = null;
  audio.pause();
  audio.src = '';
  playToggle.textContent = 'Play';
  setStatus('Select a station to listen.');
  activeStation = null;
}

closePanelButton.addEventListener('click', hidePanel);

function updateUI(station) {
  stationNameEl.textContent = station.name;
  stationLocationEl.textContent = `${station.city}, ${station.country}`;
  stationDescriptionEl.textContent = station.description;
  visitSiteEl.href = station.website;
  visitSiteEl.textContent = 'Visit Website';
  playToggle.textContent = 'Play';
  revealPanel();
}

function togglePlayback() {
  if (!activeStation) {
    return;
  }

  if (audio.paused) {
    audio.play().catch(() => setStatus('Unable to play stream automatically.'));
    playToggle.textContent = 'Pause';
    setStatus(`Now playing: ${activeStation.name}`);
  } else {
    audio.pause();
    playToggle.textContent = 'Play';
    setStatus(`Paused: ${activeStation.name}`);
  }
}

playToggle.addEventListener('click', togglePlayback);

audio.addEventListener('playing', () => {
  if (activeStation) {
    setStatus(`Now playing: ${activeStation.name}`);
  }
});

audio.addEventListener('pause', () => {
  if (activeStation) {
    setStatus(`Paused: ${activeStation.name}`);
  }
});

audio.addEventListener('error', () => {
  setStatus('Stream unavailable. Please try another station.');
});

function selectMarker() {
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(markerMeshes);
  if (intersects.length === 0) {
    return;
  }
  const marker = markers.find((m) => m.mesh === intersects[0].object);
  if (!marker) {
    return;
  }
  activeStation = marker.station;
  updateUI(marker.station);
  focusCameraOn(marker.mesh.position.clone());
  audio.pause();
  audio.src = marker.station.streamUrl;
  audio.load();
  togglePlayback();
}

function updateHoverState(nextHovered) {
  markers.forEach((marker) => {
    const hovered = marker.mesh === nextHovered;
    marker.hovered = hovered;
    marker.targetScale = hovered ? 1.6 : 1;
    marker.targetOpacity = hovered ? 1 : 0.6;
  });
}

function updateMarkers(delta, elapsed) {
  markers.forEach((marker, index) => {
    marker.currentScale = THREE.MathUtils.damp(marker.currentScale, marker.targetScale, 6, delta);
    marker.mesh.scale.setScalar(marker.currentScale);
    marker.currentOpacity = THREE.MathUtils.damp(
      marker.currentOpacity,
      marker.targetOpacity,
      6,
      delta
    );
    marker.ring.material.opacity = marker.currentOpacity;
    marker.ring.rotation.z += delta * (0.8 + index * 0.12);

    const pulsePhase = (elapsed * 0.35 + marker.pulseOffset) % 1;
    const pulseScale = 1 + pulsePhase * 2.6;
    marker.pulse.scale.setScalar(pulseScale);
    marker.pulse.material.opacity = Math.max(0, 0.35 * (1 - pulsePhase));
  });
}

function updateFocusAnimation(time) {
  if (!focusAnimation) {
    return;
  }

  const progress = Math.min((time - focusAnimation.startTime) / focusAnimation.duration, 1);
  const eased = easeInOutQuad(progress);
  camera.position.lerpVectors(focusAnimation.start, focusAnimation.end, eased);
  if (progress >= 1) {
    focusAnimation = null;
  }
}

function render(time = 0) {
  requestAnimationFrame(render);
  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;

  updateFocusAnimation(time);
  updateMarkers(delta, elapsed);

  halo.rotation.z += delta * (Math.PI * 2) / 40;
  stars.rotation.y += delta * (Math.PI * 2) / 240;
  atmosphere.material.opacity = 0.34 + Math.sin(elapsed * 0.6) * 0.08;

  controls.update();

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(markerMeshes);
  hoveredMarker = intersects.length ? intersects[0].object : null;
  updateHoverState(hoveredMarker);

  renderer.render(scene, camera);
}

render();

setStatus('Spin the globe and tap a beacon to listen.');

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    hidePanel();
  }
});
