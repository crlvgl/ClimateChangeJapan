import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

// Three.js scene module
let scene, camera, renderer, controls;
const loader = new GLTFLoader();
let fishModel = null;
let fishAnimations = [];
let mixers = [];
const clock = new THREE.Clock();

// grouping/labels
export const numGroups = 3;
const groups = [];

function createTextTexture(text, opts = {}) {
    const font = opts.font || '28px Arial';
    const padding = opts.padding || 16;
    const fg = opts.fg || '#ffffff';
    const bg = opts.bg || 'rgba(0,0,0,0.5)';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    const metrics = ctx.measureText(text);
    const textWidth = Math.ceil(metrics.width);
    const textHeight = Math.ceil(parseInt(font, 10));

    canvas.width = textWidth + padding * 2;
    canvas.height = textHeight + padding * 2;

    // background
    ctx.fillStyle = bg;
    const r = 8;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(canvas.width - r, 0);
    ctx.quadraticCurveTo(canvas.width, 0, canvas.width, r);
    ctx.lineTo(canvas.width, canvas.height - r);
    ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - r, canvas.height);
    ctx.lineTo(r, canvas.height);
    ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();

    // text
    ctx.font = font;
    ctx.fillStyle = fg;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return { texture, canvas };
}

export function initGroups(initialBaseValue = 0) {
    if (groups.length > 0) return;
    for (let gi = 0; gi < numGroups; gi++) {
        const factor = 1 + (gi - (numGroups - 1) / 2) * 0.2;
        const val = Math.round(initialBaseValue * factor);
        const { texture } = createTextTexture(String(val + '¥'));
        const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
        groups.push({ id: gi, value: val, material, texture });
    }
}

export function updateGroupLabels(values) {
    for (let gi = 0; gi < numGroups; gi++) {
        const g = groups[gi];
        const newText = (gi < values.length) ? String(values[gi]) : String(values[0] || 0);
        if (g.texture && g.texture.dispose) {
            try { g.texture.dispose(); } catch (e) { }
        }
        const { texture } = createTextTexture(newText + '¥');
        g.texture = texture;
        g.material.map = texture;
        g.material.needsUpdate = true;
        g.value = newText;
    }
}

// runtime instance data
let cubes = [];
let fishData = [];

const swimBounds = {
    x: [-90, 90],
    y: [-22, 22],
    z: [-5, 5]
};
const spawnFlipY = Math.PI;

export function clearCubes() {
    cubes.forEach(cube => scene.remove(cube));
    cubes = [];
    mixers.forEach(m => { try { m.stopAllAction(); } catch (e) { } });
    mixers = [];
    fishData = [];
}

export function createCubes(count) {
    clearCubes();
    initGroups(0);
    for (let i = 0; i < count; i++) {
        let instance;
        const wrapper = new THREE.Object3D();
        if (fishModel) {
            instance = SkeletonUtils.clone(fishModel);
            instance.position.set(0, 0, 0);
            wrapper.add(instance);
            if (fishAnimations && fishAnimations.length > 0) {
                const mixer = new THREE.AnimationMixer(instance);
                const clip = fishAnimations[0];
                try {
                    const action = mixer.clipAction(clip);
                    action.reset();
                    action.play();
                } catch (e) {
                    console.warn('Could not create animation action for clone:', e);
                }
                mixers.push(mixer);
            }
        } else {
            const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const material = new THREE.MeshBasicMaterial({ color: 0x0077ff });
            instance = new THREE.Mesh(geometry, material);
            wrapper.add(instance);
        }

        const px = swimBounds.x[0] + Math.random() * (swimBounds.x[1] - swimBounds.x[0]);
        const py = swimBounds.y[0] + Math.random() * (swimBounds.y[1] - swimBounds.y[0]);
        const pz = swimBounds.z[0] + Math.random() * (swimBounds.z[1] - swimBounds.z[0]);
        wrapper.position.set(px, py, pz);
        wrapper.rotation.y = Math.random() * Math.PI * 2;

        scene.add(wrapper);
        cubes.push(wrapper);

        const lateralBias = 0.2;
        const vx = (Math.random() * 2 - 1);
        const vy = (Math.random() * 2 - 1) * lateralBias;
        const vz = (Math.random() * 2 - 1) * lateralBias;
        const vel = new THREE.Vector3(vx, vy, vz).normalize();
        const speed = 0.5 + Math.random() * 1.5;
        const groupIndex = i % numGroups;

        const label = new THREE.Sprite(groups[groupIndex].material);
        label.position.set(0, 1.6, 0);
        label.scale.set(1.4, 0.6, 1);
        label.material.depthTest = false;
        wrapper.add(label);

        fishData.push({ wrapper, velocity: vel, speed, groupIndex, label });
    }
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixers && mixers.length > 0) mixers.forEach(m => m.update(delta));

    for (let i = 0; i < fishData.length; i++) {
        const f = fishData[i];
        const w = f.wrapper;
        const move = f.velocity.clone().multiplyScalar(f.speed * delta);
        w.position.add(move);

        if (w.position.x < swimBounds.x[0]) { w.position.x = swimBounds.x[0] + (swimBounds.x[0] - w.position.x); f.velocity.x *= -1; }
        else if (w.position.x > swimBounds.x[1]) { w.position.x = swimBounds.x[1] - (w.position.x - swimBounds.x[1]); f.velocity.x *= -1; }
        if (w.position.y < swimBounds.y[0]) { w.position.y = swimBounds.y[0] + (swimBounds.y[0] - w.position.y); f.velocity.y *= -1; }
        else if (w.position.y > swimBounds.y[1]) { w.position.y = swimBounds.y[1] - (w.position.y - swimBounds.y[1]); f.velocity.y *= -1; }
        if (w.position.z < swimBounds.z[0]) { w.position.z = swimBounds.z[0] + (swimBounds.z[0] - w.position.z); f.velocity.z *= -1; }
        else if (w.position.z > swimBounds.z[1]) { w.position.z = swimBounds.z[1] - (w.position.z - swimBounds.z[1]); f.velocity.z *= -1; }

        const wobble = 0.2 * delta;
        f.velocity.x += (Math.random() * 2 - 1) * wobble;
        f.velocity.y += (Math.random() * 2 - 1) * wobble * 0.3;
        f.velocity.z += (Math.random() * 2 - 1) * wobble;
        f.velocity.normalize();

        const lookTarget = w.position.clone().add(f.velocity);
        w.lookAt(lookTarget);
        w.rotateY(spawnFlipY);

        if (f.label) f.label.quaternion.copy(camera.quaternion);
    }

    if (controls) controls.update();
    renderer.render(scene, camera);
}

// Promise that resolves when the GLTF model is loaded
let _modelLoadedResolve;
export const modelLoadedPromise = new Promise(resolve => { _modelLoadedResolve = resolve; });

export function initThree(containerId = 'three-container') {
    const threeContainer = document.getElementById(containerId);
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x00314d);
    camera = new THREE.PerspectiveCamera(75, threeContainer.clientWidth / threeContainer.clientHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
    threeContainer.appendChild(renderer.domElement);

    const light = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(light);
    const directLight = new THREE.DirectionalLight(0xffffff, 3.0);
    directLight.position.set(1, 1, 2);
    directLight.castShadow = true;
    scene.add(directLight);

    camera.position.z = 20;
    controls = new OrbitControls(camera, renderer.domElement);
    // Disable orbiting and panning. We'll handle zoom on the world Z axis ourselves.
    controls.enableRotate = false;
    controls.enablePan = false;
    controls.enableZoom = false; // prevent OrbitControls from altering camera distance
    controls.enableDamping = false;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);
    controls.update();

    // Keep camera z between these bounds when zooming
    const _minCameraZ = 5;
    const _maxCameraZ = 30;

    // Ensure initial camera z is 20
    camera.position.z = 20;

    // Custom wheel handler: only change camera.position.z (world z-axis)
    function _onWheelZoom(e) {
        // prevent page scroll
        e.preventDefault();
        // deltaY > 0 -> scroll down -> zoom out (increase z)
        const sensitivity = 0.02; // tweak for desired feel
        const dz = e.deltaY * sensitivity;
        camera.position.z = THREE.MathUtils.clamp(camera.position.z + dz, _minCameraZ, _maxCameraZ);
    }
    // Attach to renderer DOM element so interactions are limited to the 3D canvas
    renderer.domElement.addEventListener('wheel', _onWheelZoom, { passive: false });

    // load model
    loader.load('3DModels/bluefin_tuna_gltf/scene.gltf', gltf => {
        fishModel = gltf.scene;
        fishAnimations = gltf.animations || [];
        fishModel.traverse(node => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                const convertToUnlit = (mat) => {
                    if (!mat) return mat;
                    const params = {
                        color: (mat.color !== undefined) ? mat.color.clone() : undefined,
                        map: mat.map || null,
                        aoMap: null,
                        lightMap: null,
                        transparent: !!mat.transparent,
                        opacity: (mat.opacity !== undefined) ? mat.opacity : 1,
                        alphaTest: mat.alphaTest || 0,
                        side: mat.side || THREE.FrontSide,
                        skinning: mat.skinning || false,
                        morphTargets: mat.morphTargets || false,
                        morphNormals: mat.morphNormals || false,
                    };
                    if (params.map) params.map.encoding = THREE.sRGBEncoding;
                    const newMat = new THREE.MeshBasicMaterial(params);
                    newMat.name = (mat.name ? mat.name + ' (unlit)' : 'unlit-material');
                    newMat.needsUpdate = true;
                    return newMat;
                };
                if (Array.isArray(node.material)) node.material = node.material.map(m => convertToUnlit(m));
                else node.material = convertToUnlit(node.material);
            }
        });
        fishModel.scale.set(0.02, 0.02, 0.02);
        fishModel.rotation.y = Math.PI;
        const bbox = new THREE.Box3().setFromObject(fishModel);
        const size = bbox.getSize(new THREE.Vector3());
        const center = bbox.getCenter(new THREE.Vector3());
        fishModel.position.sub(center);
        const maxDim = Math.max(size.x, size.y, size.z);
        const fitDist = maxDim * 2.0 + 2.0;
        // Keep camera on world Z = 20 as requested; adjust X/Y to center on model
        camera.position.set(0, maxDim * 0.5, 20);
        camera.near = 0.1;
        camera.far = Math.max(1000, fitDist * 10);
        camera.updateProjectionMatrix();
        controls.target.set(0, 0, 0);
        controls.update();
        if (_modelLoadedResolve) _modelLoadedResolve();
    }, undefined, err => {
        console.error('Error loading GLTF model:', err);
        if (_modelLoadedResolve) _modelLoadedResolve();
    });

    animate();
}
