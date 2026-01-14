// --- 1. SETUP THREE.JS ---
const container = document.getElementById('webgl');
const scene = new THREE.Scene();
// Background fog for infinite depth
scene.fog = new THREE.FogExp2(0x050505, 0.02);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding;
container.appendChild(renderer.domElement);

// --- 2. LIGHTING (Studio Setup) ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

// Key Light (Warm)
const keyLight = new THREE.SpotLight(0xffaa00, 2);
keyLight.position.set(10, 10, 10);
keyLight.castShadow = true;
scene.add(keyLight);

// Fill Light (Cool)
const fillLight = new THREE.PointLight(0x0088ff, 1);
fillLight.position.set(-10, 0, 5);
scene.add(fillLight);

// Rim Light (Sharp)
const rimLight = new THREE.SpotLight(0xffffff, 3);
rimLight.position.set(0, 10, -10);
scene.add(rimLight);


// --- 3. CREATE THE 4 DISTINCT MODELS ---
const objects = [];

// MODEL 1: THE NEBULA (Particles)
const nebulaGroup = new THREE.Group();
const pGeo = new THREE.IcosahedronGeometry(0.1, 0);
const pMat = new THREE.MeshStandardMaterial({ 
    color: 0xD4AF37, roughness: 0.4, metalness: 1 
});
const particles = new THREE.InstancedMesh(pGeo, pMat, 400);
const dummy = new THREE.Object3D();

for(let i=0; i<400; i++) {
    dummy.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
    );
    dummy.rotation.set(Math.random()*3, Math.random()*3, Math.random()*3);
    const scale = Math.random();
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    particles.setMatrixAt(i, dummy.matrix);
}
nebulaGroup.add(particles);
scene.add(nebulaGroup);
objects.push(nebulaGroup);

// MODEL 2: THE QUANTUM CAGE (Neon Geometry)
const cageGroup = new THREE.Group();
const cageGeo = new THREE.IcosahedronGeometry(2.5, 1);
const cageMat = new THREE.MeshBasicMaterial({ 
    color: 0x0088ff, wireframe: true, transparent: true, opacity: 0.3 
});
const cageOuter = new THREE.Mesh(cageGeo, cageMat);
const cageInner = new THREE.Mesh(new THREE.OctahedronGeometry(1.5), new THREE.MeshStandardMaterial({
    color: 0x000000, roughness: 0.1, metalness: 0.9, emissive: 0x002255
}));
cageGroup.add(cageOuter, cageInner);
cageGroup.visible = false; // Start hidden
scene.add(cageGroup);
objects.push(cageGroup);

// MODEL 3: LIQUID GLASS ORB
const fluidGroup = new THREE.Group();
const fluidGeo = new THREE.SphereGeometry(2, 64, 64);
const fluidMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0.1, roughness: 0,
    transmission: 0.95, // Glass effect
    thickness: 1,
    envMapIntensity: 2,
    clearcoat: 1, clearcoatRoughness: 0
});
const sphere = new THREE.Mesh(fluidGeo, fluidMat);
fluidGroup.add(sphere);
fluidGroup.visible = false;
scene.add(fluidGroup);
objects.push(fluidGroup);

// MODEL 4: THE GYROSCOPE (Mechanical)
const gyroGroup = new THREE.Group();
const goldMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 1, roughness: 0.2 });
const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.5 });

const r1 = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.1, 16, 100), goldMat);
const r2 = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.15, 16, 100), darkMat);
const r3 = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.1, 16, 100), goldMat);
const core = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 32), darkMat);

gyroGroup.add(r1, r2, r3, core);
gyroGroup.visible = false;
scene.add(gyroGroup);
objects.push(gyroGroup);


// --- 4. SCROLL INTERACTION SYSTEM ---

let scrollY = 0;
let scrollPercent = 0;
const totalSections = 4;

// INTERSECTION OBSERVER FOR CARDS
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if(entry.isIntersecting) entry.target.classList.add('in-view');
    });
}, { threshold: 0.3 });

document.querySelectorAll('.card').forEach(c => observer.observe(c));

window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    scrollPercent = scrollY / maxScroll;
    
    // Update UI line
    document.getElementById('progInd').style.top = `${scrollPercent * 160}px`;
});

// Mouse Tracking
let mouseX = 0, mouseY = 0;
window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- 5. ANIMATION LOOP ---
const clock = new THREE.Clock();

function animate() {
    const time = clock.getElapsedTime();
    
    // Determine active section based on scroll
    // Map 0-1 to 0-3
    const floatIndex = scrollPercent * (totalSections - 1);
    const index = Math.floor(floatIndex + 0.5); // Round to nearest section
    
    // --- MORPHING LOGIC ---
    objects.forEach((obj, i) => {
        // Base Rotation
        obj.rotation.y = time * 0.2;
        obj.rotation.x = time * 0.1;

        if (i === index) {
            obj.visible = true;
            // Transition In effect
            const dist = Math.abs(floatIndex - i);
            const scale = 1 - (dist * 0.5);
            const clampedScale = Math.max(0, scale);
            
            obj.scale.setScalar(THREE.MathUtils.lerp(obj.scale.x, clampedScale, 0.1));
            
        } else {
            // Smoothly hide
            if(obj.scale.x < 0.01) obj.visible = false;
            obj.scale.setScalar(THREE.MathUtils.lerp(obj.scale.x, 0, 0.1));
        }
    });

    // --- SPECIFIC OBJECT ANIMATIONS ---
    
    // 1. Nebula Pulse
    if(nebulaGroup.visible) {
        nebulaGroup.rotation.y = time * 0.05;
        particles.rotation.z = scrollPercent * 2;
    }

    // 2. Cage Spin
    if(cageGroup.visible) {
        cageOuter.rotation.x = time;
        cageInner.rotation.y = -time;
    }

    // 3. Fluid Distortion
    if(fluidGroup.visible) {
        sphere.scale.set(
            1 + Math.sin(time*2)*0.05, 
            1 + Math.cos(time*2.5)*0.05, 
            1 + Math.sin(time*1.5)*0.05
        );
    }

    // 4. Gyro Mechanics
    if(gyroGroup.visible) {
        gyroGroup.children[0].rotation.x = time * 2;
        gyroGroup.children[1].rotation.y = time * 1.5;
        gyroGroup.children[2].rotation.x = -time;
    }

    // Camera Parallax based on mouse
    camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
    camera.position.y += (mouseY * 0.5 - camera.position.y) * 0.05;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();
