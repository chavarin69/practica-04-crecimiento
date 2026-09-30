import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ==========================================
// 1. ESCENA, CÁMARA Y RENDERER
// ==========================================
const scene = new THREE.Scene();
const colorDia = new THREE.Color(0x87CEEB);
scene.background = colorDia; 
document.body.style.backgroundColor = '#' + colorDia.getHexString();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const initialCameraPos = new THREE.Vector3(0, 8, 15);
camera.position.copy(initialCameraPos);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 2, 0);

// ==========================================
// 2. ILUMINACIÓN
// ==========================================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(10, 15, 10);
dirLight.castShadow = true;
scene.add(dirLight);

// ==========================================
// 3. CONSTRUCCIÓN DE LA PLANTA (JERARQUÍA)
// ==========================================
const interactableObjects = [];

// A) Suelo
const sueloGeo = new THREE.CylinderGeometry(5, 5, 0.5, 32);
const sueloMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); 
const suelo = new THREE.Mesh(sueloGeo, sueloMat);
suelo.receiveShadow = true;
suelo.userData = { name: "Suelo Agrícola", type: "Cilindro", desc: "Suelo rico en hierro." };
scene.add(suelo);
interactableObjects.push(suelo);

const agaveGroup = new THREE.Group();
agaveGroup.position.y = 0.25; 
scene.add(agaveGroup);

// B) Piña
const pinaGeo = new THREE.SphereGeometry(1.2, 32, 32);
pinaGeo.scale(1, 1.2, 1); 
pinaGeo.translate(0, 1.2, 0); // TRUCO: Desplazamos la esfera hacia arriba para que el ancla (0) quede en su base
const pinaMat = new THREE.MeshStandardMaterial({ color: 0xdbd8a0, roughness: 0.9 });
const pina = new THREE.Mesh(pinaGeo, pinaMat);
pina.position.y = 0; // Ahora el punto de inicio es exactamente el suelo
pina.castShadow = true;
pina.userData = { name: "Piña (Corazón)", type: "Esfera", desc: "Almacena los azúcares." };
agaveGroup.add(pina);
interactableObjects.push(pina);

// C) Quiote
const quioteGeo = new THREE.CylinderGeometry(0.15, 0.2, 5, 16);
quioteGeo.translate(0, 2.5, 0); // El ancla ya estaba en la base
const quioteMat = new THREE.MeshStandardMaterial({ color: 0x7a9c59 });
const quiote = new THREE.Mesh(quioteGeo, quioteMat);
// El quiote brota del centro cuando la piña ya creció. Lo bajamos a 2.0 para que nazca "desde adentro" de la piña.
quiote.position.y = 2.0; 
quiote.castShadow = true;
quiote.userData = { name: "Quiote", type: "Cilindro", desc: "Tallo floral que brota al final del ciclo." };
agaveGroup.add(quiote);
interactableObjects.push(quiote);

// D) Pencas
const pencasGroup = new THREE.Group();
const pencaMat = new THREE.MeshStandardMaterial({ color: 0x5a7d71 });

const capas = 5; 
const pencasPorCapa = 12; 
const pivotesArray = []; // Guardamos los pivotes para la simulación del viento

for (let i = 0; i < capas; i++) {
    for (let j = 0; j < pencasPorCapa; j++) {
        const pivote = new THREE.Group();
        const anguloBase = (j / pencasPorCapa) * Math.PI * 2;
        const desfase = (i % 2) * (Math.PI / pencasPorCapa); 
        pivote.rotation.y = anguloBase + desfase;
        pivote.position.y = 0.5 + (i * 0.4);

        const alturaPenca = 3.5 + (i * 0.2); 
        const pencaGeo = new THREE.ConeGeometry(0.4, alturaPenca, 5);
        pencaGeo.translate(0, alturaPenca / 2, 0); 
        
        const penca = new THREE.Mesh(pencaGeo, pencaMat);
        penca.scale.set(1, 1, 0.15); 
        const inclinacion = (Math.PI / 2.2) - (i * 0.22);
        penca.rotation.x = inclinacion;
        penca.castShadow = true;
        
        penca.userData = {
            name: `Penca (Capa ${i+1})`,
            type: "Cono Modificado",
            desc: "Parte del follaje del agave que captura energía."
        };
        
        pivote.add(penca);
        pencasGroup.add(pivote);
        pivotesArray.push(pivote);
        interactableObjects.push(penca); 
    }
}
agaveGroup.add(pencasGroup);

// INICIALIZAR TAMAÑOS EN CERO PARA SIMULAR CRECIMIENTO
pina.scale.set(0.001, 0.001, 0.001);
pencasGroup.scale.set(0.001, 0.001, 0.001);
quiote.scale.set(0.001, 0.001, 0.001);

// ==========================================
// 4. RAYCASTING Y PANEL DE INFORMACIÓN
// ==========================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const infoPanel = document.getElementById('info-panel');
const uiName = document.getElementById('info-name');
const uiType = document.getElementById('info-type');
const uiGrowth = document.getElementById('info-growth');
const uiDesc = document.getElementById('info-desc');

let selectedObject = null;
let originalEmissive = new THREE.Color(0x000000);

window.addEventListener('pointerdown', (event) => {
    if (event.target.closest('#controls-panel')) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactableObjects, false);

    if (intersects.length > 0) {
        const hit = intersects[0].object;

        if (selectedObject && selectedObject.material) {
            selectedObject.material.emissive.copy(originalEmissive);
        }
        selectedObject = hit;
        
        if (selectedObject.material) {
            originalEmissive.copy(selectedObject.material.emissive);
            selectedObject.material.emissive.setHex(0x444444); 
        }

        const data = selectedObject.userData;
        if(data) {
            uiName.innerText = data.name;
            uiType.innerText = data.type;
            uiDesc.innerText = data.desc;
            
            // Calcular porcentaje de crecimiento dinámico
            let parentScale = 1;
            if(data.name.includes("Piña")) parentScale = pina.scale.x;
            else if(data.name.includes("Penca")) parentScale = pencasGroup.scale.x;
            else if(data.name.includes("Quiote")) parentScale = quiote.scale.x;
            else parentScale = 1; // Para el suelo
            
            uiGrowth.innerText = Math.round(parentScale * 100);
            infoPanel.classList.remove('hidden');
        }

    } else {
        if (selectedObject && selectedObject.material) {
            selectedObject.material.emissive.copy(originalEmissive);
        }
        selectedObject = null;
        infoPanel.classList.add('hidden');
    }
});

// ==========================================
// 5. VARIABLES DE ESTADO Y CONTROLES HTML
// ==========================================
let currentGrowthTime = 0;
let currentWindTime = 0;
let isGrowing = true;
let isWindy = true;
let globalGrowthSpeed = 1.5;
let globalWindIntensity = 1.0;

document.getElementById('growth-speed').addEventListener('input', (e) => {
    globalGrowthSpeed = parseFloat(e.target.value);
});

document.getElementById('wind-intensity').addEventListener('input', (e) => {
    globalWindIntensity = parseFloat(e.target.value);
});

document.getElementById('btn-pause-growth').addEventListener('click', (e) => {
    isGrowing = !isGrowing;
    e.target.innerText = isGrowing ? "Pausar Crecimiento" : "Reanudar Crecimiento";
});

document.getElementById('btn-restart').addEventListener('click', () => {
    currentGrowthTime = 0;
    isGrowing = true;
    document.getElementById('btn-pause-growth').innerText = "Pausar Crecimiento";
});

document.getElementById('btn-anim').addEventListener('click', (e) => {
    isWindy = !isWindy;
    e.target.innerText = isWindy ? "Pausar Viento" : "Reanudar Viento";
});

let sequiaActiva = false;
const colorNormal = new THREE.Color(0x5a7d71);
const colorSequia = new THREE.Color(0xcc5533);
let targetColor = colorNormal.clone(); // Color al que la planta intentará llegar

document.getElementById('btn-color-leaves').addEventListener('click', () => {
    sequiaActiva = !sequiaActiva;
    targetColor = sequiaActiva ? colorSequia : colorNormal;
});

document.getElementById('btn-camera').addEventListener('click', () => {
    camera.position.copy(initialCameraPos);
    controls.target.set(0, 2, 0);
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==========================================
// Controles del Modal de Cuestionario
// ==========================================
const qaModal = document.getElementById('qa-modal');

document.getElementById('btn-qa').addEventListener('click', () => {
    qaModal.classList.remove('hidden');
});

document.getElementById('btn-close-qa').addEventListener('click', () => {
    qaModal.classList.add('hidden');
});

// ==========================================
// 6. BUCLE DE ANIMACIÓN (CRECIMIENTO Y VIENTO)
// ==========================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    // 1. Lógica de Crecimiento Controlado
    if (isGrowing) {
        // Incrementamos la variable de tiempo general de vida de la planta
        currentGrowthTime += (delta * globalGrowthSpeed * 2);
        
        // Fase 1: Crece la piña (del tiempo 0 al 30)
        let sPina = Math.min(Math.max(currentGrowthTime / 30, 0.001), 1);
        pina.scale.set(sPina, sPina, sPina);

        // Fase 2: Crecen las pencas una vez que la piña tiene tamaño (tiempo 20 al 80)
        let sPencas = Math.min(Math.max((currentGrowthTime - 20) / 60, 0.001), 1);
        pencasGroup.scale.set(sPencas, sPencas, sPencas);

        // Fase 3: Emerge el Quiote al final del ciclo (tiempo 80 al 120)
        let sQuiote = Math.min(Math.max((currentGrowthTime - 80) / 40, 0.001), 1);
        quiote.scale.set(sQuiote, sQuiote, sQuiote);
    }

    // 2. Simulación de Viento (Ondulación matemática en cada penca)
    if (isWindy) {
        currentWindTime += delta; // El reloj del viento solo avanza si no está pausado
        
        pivotesArray.forEach((pivote, index) => {
            const offset = index * 0.2; 
            pivote.rotation.z = Math.sin(currentWindTime * 2 + offset) * (0.02 * globalWindIntensity);
        });
    }
    
    // 3. Transición de color progresiva (Sequía)
    // Lerp mezcla suavemente el color actual del material de las pencas con el targetColor
    pencaMat.color.lerp(targetColor, delta * 1.5);

    // Actualizar porcentaje en vivo si hay algo seleccionado mientras crece
    if (selectedObject && isGrowing) {
        let parentScale = 1;
        const data = selectedObject.userData;
        if(data.name.includes("Piña")) parentScale = pina.scale.x;
        else if(data.name.includes("Penca")) parentScale = pencasGroup.scale.x;
        else if(data.name.includes("Quiote")) parentScale = quiote.scale.x;
        uiGrowth.innerText = Math.round(parentScale * 100);
    }

    controls.update();
    renderer.render(scene, camera);
}

animate();