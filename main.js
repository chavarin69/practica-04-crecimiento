import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ==========================================
// 1. ESCENA, CÁMARA Y RENDERER
// ==========================================
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x87CEEB, 0.008); 

const colorDia = new THREE.Color(0x87CEEB);
const colorNoche = new THREE.Color(0x0a1931);
scene.background = colorDia;
document.body.style.backgroundColor = '#' + colorDia.getHexString();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const initialCameraPos = new THREE.Vector3(0, 10, 25); 
camera.position.copy(initialCameraPos);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 2, 0);
controls.maxPolarAngle = Math.PI / 2 - 0.05; 

// ==========================================
// 2. ILUMINACIÓN 
// ==========================================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(20, 30, 20);
dirLight.castShadow = true;
dirLight.shadow.camera.left = -40;
dirLight.shadow.camera.right = 40;
dirLight.shadow.camera.top = 40;
dirLight.shadow.camera.bottom = -40;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

// ==========================================
// 3. TERRENO CON RELIEVE SUAVIZADO
// ==========================================
const planoGeo = new THREE.PlaneGeometry(150, 150, 60, 60);

const posiciones = planoGeo.attributes.position.array;
for (let i = 0; i < posiciones.length; i += 3) {
    const x = posiciones[i];
    const y = posiciones[i + 1]; 
    
    const distanciaAlCentro = Math.sqrt(x * x + y * y);
    
    if (distanciaAlCentro > 15) {
        const relieve = Math.sin(x / 12) * Math.cos(y / 12) * 0.8;
        posiciones[i + 2] = relieve; 
    }
}
planoGeo.computeVertexNormals();

const planoMat = new THREE.MeshStandardMaterial({ color: 0x4a3b2c, roughness: 0.9 });
const terreno = new THREE.Mesh(planoGeo, planoMat);
terreno.rotation.x = -Math.PI / 2; 
terreno.receiveShadow = true;
scene.add(terreno);

// ==========================================
// 4. ELEMENTOS DEL ENTORNO 
// ==========================================
const plantasEntorno = []; 

function generarEscenario() {
    const rocaMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.8 });
    const troncoMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 1 });
    const hojasMat = new THREE.MeshStandardMaterial({ color: 0x2d4c1e, roughness: 0.9 });

    for (let i = 0; i < 120; i++) {
        const x = (Math.random() - 0.5) * 130;
        const z = (Math.random() - 0.5) * 130;
        if (x > -16 && x < 16 && z > -16 && z < 16) continue;

        const tipo = Math.random();
        if (tipo < 0.3) {
            const radioRoca = Math.random() * 1.5 + 0.5;
            const rocaGeo = new THREE.SphereGeometry(radioRoca, 5, 4);
            const roca = new THREE.Mesh(rocaGeo, rocaMat);
            roca.position.set(x, radioRoca * 0.5, z);
            roca.rotation.set(Math.random(), Math.random(), 0);
            roca.castShadow = true;
            scene.add(roca);
        } else if (tipo < 0.6) {
            const radioArb = Math.random() * 1.5 + 0.8;
            const arbGeo = new THREE.SphereGeometry(radioArb, 8, 8);
            const arbusto = new THREE.Mesh(arbGeo, hojasMat);
            arbusto.position.set(x, radioArb * 0.6, z);
            arbusto.castShadow = true;
            scene.add(arbusto);
            plantasEntorno.push(arbusto);
        } else {
            const arbol = new THREE.Group();
            arbol.position.set(x, 0, z);
            
            const altoTronco = Math.random() * 4 + 3; 
            const troncoGeo = new THREE.CylinderGeometry(0.6, 0.8, altoTronco);
            const tronco = new THREE.Mesh(troncoGeo, troncoMat);
            tronco.position.y = altoTronco / 2;
            tronco.castShadow = true;
            
            const altoCopa = Math.random() * 6 + 5; 
            const copaGeo = new THREE.ConeGeometry(3.5, altoCopa, 8);
            const copa = new THREE.Mesh(copaGeo, hojasMat);
            copa.position.y = altoTronco + (altoCopa / 2) - 1; 
            copa.castShadow = true;
            
            arbol.add(tronco);
            arbol.add(copa);
            scene.add(arbol);
            plantasEntorno.push(arbol);
        }
    }
}
generarEscenario();

// ==========================================
// 5. GENERADOR DE AGAVES MULTIPLES Y CRECIMIENTO
// ==========================================
const interactableObjects = [];
const todosLosAgaves = []; 
const agaveMatBase = new THREE.MeshStandardMaterial({ color: 0x5a7d71 }); 

function crearAgave(posX, posZ, id) {
    const agaveGroup = new THREE.Group();
    // 1. CORRECCIÓN: Nivel de tierra. Cambiamos el 0.2 por 0 para que no flote
    agaveGroup.position.set(posX, 0, posZ);

    const variacionGlobal = 0.9 + (Math.random() * 0.2); 
    agaveGroup.scale.set(variacionGlobal, variacionGlobal, variacionGlobal);

    const baseRotX = (Math.random() - 0.5) * 0.25; 
    const baseRotZ = (Math.random() - 0.5) * 0.25;
    agaveGroup.userData.baseRotX = baseRotX;
    agaveGroup.userData.baseRotZ = baseRotZ;
    agaveGroup.rotation.set(baseRotX, 0, baseRotZ);

    const matPencas = agaveMatBase.clone();
    matPencas.userData.targetColor = new THREE.Color(0x5a7d71); 
    matPencas.userData.isDrought = false;
    agaveGroup.userData.materialPencas = matPencas; 

    // A) Piña (Anclada al suelo para el crecimiento)
    const pinaGeo = new THREE.SphereGeometry(1.2, 32, 32);
    pinaGeo.scale(1, 1.2, 1);
    // 2. CORRECCIÓN MATEMÁTICA: Radio(1.2) * Escala(1.2) = 1.44. Subimos 1.44 para que el centro sea la base.
    pinaGeo.translate(0, 1.44, 0); 
    const pinaMat = new THREE.MeshStandardMaterial({ color: 0xdbd8a0, roughness: 0.9 });
    const pina = new THREE.Mesh(pinaGeo, pinaMat);
    pina.position.y = 0; 
    pina.castShadow = true;
    pina.userData = { idAgave: id, name: `Piña (Planta #${id})`, type: "Esfera", desc: "Corazón del agave." };
    agaveGroup.add(pina);
    interactableObjects.push(pina);

    // B) Quiote
    const alturaQuiote = 5 * (0.9 + Math.random() * 0.2); 
    const quioteGeo = new THREE.CylinderGeometry(0.15, 0.2, alturaQuiote, 16);
    quioteGeo.translate(0, alturaQuiote / 2, 0); 
    const quioteMat = new THREE.MeshStandardMaterial({ color: 0x7a9c59 });
    const quiote = new THREE.Mesh(quioteGeo, quioteMat);
    // 3. CORRECCIÓN: Bajamos la posición inicial a 0.5. Al escalar desde 0, nacerá oculto dentro de la piña y romperá hacia arriba.
    quiote.position.y = 0.5; 
    quiote.castShadow = true;
    quiote.name = "Quiote";
    quiote.userData = { idAgave: id, name: `Quiote (Planta #${id})`, type: "Cilindro", desc: "Tallo floral." };
    agaveGroup.add(quiote);
    interactableObjects.push(quiote);

    // C) Pencas 
    const pencasGroup = new THREE.Group();
    pencasGroup.name = "PencasGroup"; 
    const capas = 5;
    const pencasPorCapa = 12;
    const pivotesArray = []; // Para el viento

    for (let i = 0; i < capas; i++) {
        for (let j = 0; j < pencasPorCapa; j++) {
            const pivote = new THREE.Group();
            
            const anguloBase = (j / pencasPorCapa) * Math.PI * 2;
            const desfaseCapas = (i % 2) * (Math.PI / pencasPorCapa);
            pivote.rotation.y = anguloBase + desfaseCapas + ((Math.random() - 0.5) * 0.1);
            pivote.position.y = 0.5 + (i * 0.4);

            const variacionAltura = (3.5 + (i * 0.2)) * (0.9 + Math.random() * 0.2);
            const pencaGeo = new THREE.ConeGeometry(0.4, variacionAltura, 5);
            pencaGeo.translate(0, variacionAltura / 2, 0); 
            
            const penca = new THREE.Mesh(pencaGeo, matPencas); 
            penca.scale.set(1, 1, 0.15); 
            
            const inclinacion = (Math.PI / 2.2) - (i * 0.22);
            penca.rotation.x = inclinacion + ((Math.random() - 0.5) * 0.05);
            penca.castShadow = true;
            
            penca.userData = { idAgave: id, name: `Penca (Planta #${id})`, type: "Cono", desc: "Hoja de agave." };
            
            pivote.add(penca);
            pencasGroup.add(pivote);
            pivotesArray.push(pivote);
            interactableObjects.push(penca);
        }
    }
    agaveGroup.add(pencasGroup);
    scene.add(agaveGroup);
    todosLosAgaves.push(agaveGroup);

    // INICIALIZAR EN TAMAÑO CERO PARA SIMULAR CRECIMIENTO
    pina.scale.set(0.001, 0.001, 0.001);
    pencasGroup.scale.set(0.001, 0.001, 0.001);
    quiote.scale.set(0.001, 0.001, 0.001);

    // Almacenar referencias en userData para iterarlas en animate()
    agaveGroup.userData.pina = pina;
    agaveGroup.userData.pencasGroup = pencasGroup;
    agaveGroup.userData.quiote = quiote;
    agaveGroup.userData.pivotes = pivotesArray;
}

// Plantación 2x3
let idCounter = 1;
const espaciadoX = 8; 
const espaciadoZ = 9; 
for (let fila = 0; fila < 2; fila++) {
    for (let col = 0; col < 3; col++) {
        const x = (col - 1) * espaciadoX + ((Math.random() - 0.5) * 1.5); 
        const z = ((fila === 0) ? -espaciadoZ/2 : espaciadoZ/2) + ((Math.random() - 0.5) * 1.5); 
        crearAgave(x, z, idCounter);
        idCounter++;
    }
}

// ==========================================
// 6. RAYCASTING Y SELECCIÓN INDIVIDUAL
// ==========================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const infoPanel = document.getElementById('info-panel');
const uiName = document.getElementById('info-name');
const uiType = document.getElementById('info-type');
const uiDesc = document.getElementById('info-desc');
const uiGrowth = document.getElementById('info-growth');

let selectedMesh = null; 
let selectedAgaveGroup = null; 
let originalEmissive = new THREE.Color(0x000000);

window.addEventListener('pointerdown', (event) => {
    if (event.target.closest('#controls-panel') || event.target.closest('#qa-modal')) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactableObjects, false);

    if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (selectedMesh && selectedMesh.material) selectedMesh.material.emissive.copy(originalEmissive);
        
        selectedMesh = hit;
        if (selectedMesh.material) {
            originalEmissive.copy(selectedMesh.material.emissive);
            selectedMesh.material.emissive.setHex(0x555555); 
        }

        const data = selectedMesh.userData;
        selectedAgaveGroup = todosLosAgaves[data.idAgave - 1]; 
        
        if(data) {
            uiName.innerText = data.name;
            uiType.innerText = data.type;
            uiDesc.innerText = data.desc;
            
            // Lógica de porcentaje para el raycaster
            let parentScale = 1;
            if(data.name.includes("Piña")) parentScale = selectedAgaveGroup.userData.pina.scale.x;
            else if(data.name.includes("Penca")) parentScale = selectedAgaveGroup.userData.pencasGroup.scale.x;
            else if(data.name.includes("Quiote")) parentScale = selectedAgaveGroup.userData.quiote.scale.x;
            uiGrowth.innerText = Math.round(parentScale * 100);

            infoPanel.classList.remove('hidden');
        }
    } else {
        if (selectedMesh && selectedMesh.material) selectedMesh.material.emissive.copy(originalEmissive);
        selectedMesh = null;
        selectedAgaveGroup = null;
        infoPanel.classList.add('hidden');
    }
});

// ==========================================
// 7. VARIABLES DE ESTADO Y CONTROLES HTML
// ==========================================
let currentGrowthTime = 0;
let currentWindTime = 0;
let isGrowing = true;
let isAnimating = true;
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
    isAnimating = !isAnimating;
    e.target.innerText = isAnimating ? "Pausar Viento" : "Reanudar Viento";
});

document.getElementById('btn-camera').addEventListener('click', () => {
    camera.position.copy(initialCameraPos);
    controls.target.set(0, 2, 0);
});

// SEQUÍA GRADUAL 
document.getElementById('btn-color-leaves').addEventListener('click', () => {
    if (!selectedAgaveGroup) {
        alert("Primero selecciona una parte del agave que deseas secar.");
        return;
    }
    const matPencas = selectedAgaveGroup.userData.materialPencas;
    matPencas.userData.isDrought = !matPencas.userData.isDrought;
    const colorFinal = matPencas.userData.isDrought ? 0xcc5533 : 0x5a7d71;
    matPencas.userData.targetColor.setHex(colorFinal);
});

// Ocultar Quiote
document.getElementById('btn-toggle-quiote').addEventListener('click', () => {
    if (!selectedAgaveGroup) {
        alert("Primero selecciona una parte del agave.");
        return;
    }
    const quiote = selectedAgaveGroup.userData.quiote;
    if (quiote) quiote.visible = !quiote.visible;
});

// Luz, Noche y Niebla
document.getElementById('light-slider').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    dirLight.intensity = val;
    ambientLight.intensity = val * 0.4;

    const porcentajeDia = val / 3;
    const nuevoColorFondo = colorNoche.clone().lerp(colorDia, porcentajeDia);
    
    scene.background = nuevoColorFondo;
    scene.fog.color = nuevoColorFondo; 
    document.body.style.backgroundColor = '#' + nuevoColorFondo.getHexString();
});

// Controles del Modal de Cuestionario
const qaModal = document.getElementById('qa-modal');
document.getElementById('btn-qa').addEventListener('click', () => qaModal.classList.remove('hidden'));
document.getElementById('btn-close-qa').addEventListener('click', () => qaModal.classList.add('hidden'));

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==========================================
// 8. BUCLE DE ANIMACIÓN INTEGRADO
// ==========================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // LÓGICA DE CRECIMIENTO
    if (isGrowing) {
        currentGrowthTime += (delta * globalGrowthSpeed * 2);

        let sPina = Math.min(Math.max(currentGrowthTime / 30, 0.001), 1);
        let sPencas = Math.min(Math.max((currentGrowthTime - 20) / 60, 0.001), 1);
        let sQuiote = Math.min(Math.max((currentGrowthTime - 80) / 40, 0.001), 1);

        todosLosAgaves.forEach(agave => {
            agave.userData.pina.scale.set(sPina, sPina, sPina);
            agave.userData.pencasGroup.scale.set(sPencas, sPencas, sPencas);
            agave.userData.quiote.scale.set(sQuiote, sQuiote, sQuiote);
        });
    }

    // LÓGICA DE VIENTO
    if (isAnimating) {
        currentWindTime += delta;
        
        // Viento sobre Agaves y Pencas
        todosLosAgaves.forEach((agave, indexAgave) => {
            const bx = agave.userData.baseRotX;
            const bz = agave.userData.baseRotZ;
            agave.rotation.z = bz + Math.sin(currentWindTime * 0.5 + indexAgave) * (0.02 * globalWindIntensity);
            agave.rotation.x = bx + Math.cos(currentWindTime * 0.3 + indexAgave) * (0.02 * globalWindIntensity);

            agave.userData.pivotes.forEach((pivote, indexPenca) => {
                const offset = (indexPenca * 0.2) + indexAgave;
                pivote.rotation.z = Math.sin(currentWindTime * 2 + offset) * (0.02 * globalWindIntensity);
            });
        });

        // Viento sobre Entorno
        plantasEntorno.forEach((planta, index) => {
            planta.rotation.z = Math.sin(currentWindTime * 0.4 + (index * 0.1)) * (0.03 * globalWindIntensity);
        });
    }

    // Transición gradual de color (Sequía)
    todosLosAgaves.forEach((agave) => {
        const mat = agave.userData.materialPencas;
        if (mat && mat.userData.targetColor) {
            mat.color.lerp(mat.userData.targetColor, delta * 1.5); 
        }
    });

    // Actualizar porcentaje en vivo en el raycaster
    if (selectedMesh && isGrowing) {
        let parentScale = 1;
        const data = selectedMesh.userData;
        if(data.name.includes("Piña")) parentScale = selectedAgaveGroup.userData.pina.scale.x;
        else if(data.name.includes("Penca")) parentScale = selectedAgaveGroup.userData.pencasGroup.scale.x;
        else if(data.name.includes("Quiote")) parentScale = selectedAgaveGroup.userData.quiote.scale.x;
        uiGrowth.innerText = Math.round(parentScale * 100);
    }

    controls.update();
    renderer.render(scene, camera);
}
animate();