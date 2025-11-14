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

// video background
let videoElement = null;
let videoTexture = null;
let videoMesh = null;
const defaultCameraZ = 20; // initial camera z in initThree
const basePlaneDistance = 80; // base distance factor for background plane

// grouping/labels
export const numGroups = 3;
const groups = [];

function createTextTexture(text, opts = {}) {
    const font = opts.font || '28px Arial';
    const padding = opts.padding || 16;
    const fg = opts.fg || '#ffffff';
    const bg = opts.bg || 'rgba(0, 0, 0, 0.3)';

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

// label scaling when camera distance changes
const labelScaleConfig = {
    min: 0.6, // smallest label scale (for close fish)
    max: 2.0, // largest label scale (for far fish)
    // distances (in world units) used to map scale: at or below minDist -> min scale,
    // at or above maxDist -> max scale. values in-between are linearly interpolated.
    minDist: 8,
    maxDist: 28
};

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
        // store a base scale so we can scale relative to it later
        label.userData.baseScale = new THREE.Vector3(1.4, 0.6, 1).clone();

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

        // scale label based on distance to camera (farther -> larger, closer -> smaller)
        if (f.label) {
            const camPos = camera.position;
            // use world position of the label
            const labelWorldPos = new THREE.Vector3();
            f.label.getWorldPosition(labelWorldPos);
            const dist = camPos.distanceTo(labelWorldPos);
            const t = THREE.MathUtils.clamp((dist - labelScaleConfig.minDist) / (labelScaleConfig.maxDist - labelScaleConfig.minDist), 0, 1);
            const scaleFactor = THREE.MathUtils.lerp(labelScaleConfig.min, labelScaleConfig.max, t);
            const base = f.label.userData.baseScale || new THREE.Vector3(1.4, 0.6, 1);
            f.label.scale.set(base.x * scaleFactor, base.y * scaleFactor, base.z * scaleFactor);
        }
    }

    if (controls) controls.update();
    renderer.render(scene, camera);
}

// Create a hidden video element, VideoTexture and a plane mesh to show as background.
function createVideoBackground() {
    try {
        if (videoMesh) return; // already created

        videoElement = document.createElement('video');
        videoElement.src = 'video/ambiance.mp4';
        videoElement.crossOrigin = 'anonymous';
        videoElement.muted = true; // allow autoplay
        videoElement.loop = true;
        videoElement.playsInline = true;
        videoElement.preload = 'auto';
        videoElement.style.display = 'none';
        document.body.appendChild(videoElement);

        // try to play (may return a promise)
        const p = videoElement.play();
        if (p && p.then) p.catch(() => { /* ignore autoplay rejections */ });

        videoTexture = new THREE.VideoTexture(videoElement);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        videoTexture.format = THREE.RGBAFormat;
        videoTexture.encoding = THREE.sRGBEncoding;

        const geo = new THREE.PlaneGeometry(1, 1);
        const mat = new THREE.MeshBasicMaterial({ map: videoTexture, toneMapped: false });
        videoMesh = new THREE.Mesh(geo, mat);
        videoMesh.frustumCulled = false;
        // put it behind by default; updateVideoPlaneScale() will position it relative to camera
        videoMesh.renderOrder = -10;
        scene.add(videoMesh);

        // initial sizing
        updateVideoPlaneScale();
    } catch (err) {
        console.warn('Could not create video background:', err);
    }
}

function updateVideoPlaneScale() {
    if (!videoMesh || !camera || !renderer) return;

    // center plane on controls target (if available) so background follows panning target
    const target = (controls && controls.target) ? controls.target : new THREE.Vector3(0, 0, 0);
    // plane distance from camera scales with camera z so the plane appears to "zoom"
    const planeDistanceFromCamera = basePlaneDistance * (camera.position.z / defaultCameraZ);
    const planeZ = camera.position.z - planeDistanceFromCamera;

    videoMesh.position.set(target.x, target.y, planeZ);

    // compute size so that plane covers the camera frustum at that distance
    const canvasWidth = renderer.domElement.clientWidth || window.innerWidth;
    const canvasHeight = renderer.domElement.clientHeight || window.innerHeight;
    const aspect = canvasWidth / canvasHeight;
    const vFOV = THREE.MathUtils.degToRad(camera.fov);
    const height = 2 * Math.tan(vFOV / 2) * Math.abs(camera.position.z - planeZ);
    const width = height * aspect;

    videoMesh.scale.set(width, height, 1);
    // ensure the plane faces the camera
    videoMesh.lookAt(camera.position);
}

// Try to autoplay with sound. If the browser blocks autoplay with sound,
// fall back to muted playback and show a small "Enable audio" button so
// the user can allow sound with a click (user gesture).
async function attemptAutoplayWithSound() {
    if (!videoElement) return;
    try {
        // try to unmute and play at full volume
        videoElement.muted = false;
        videoElement.volume = 1.0;
        const p = videoElement.play();
        if (p && p.then) await p;
        // success: we're playing with sound
        return true;
    } catch (err) {
        // autoplay with sound blocked. fall back to muted playback and show a button
        try {
            videoElement.muted = true;
            videoElement.volume = 1.0;
            const p2 = videoElement.play();
            if (p2 && p2.then) p2.catch(() => {});
        } catch (e) {
            // ignore
        }

        // create a small enable-audio button if not already present
        if (!document.getElementById('enable-audio-btn')) {
            const btn = document.createElement('button');
            btn.id = 'enable-audio-btn';
            btn.textContent = 'Enable audio';
            Object.assign(btn.style, {
                position: 'fixed',
                left: '12px',
                bottom: '12px',
                zIndex: 9999,
                padding: '8px 12px',
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
            });
            btn.addEventListener('click', async () => {
                try {
                    if (!videoElement) return;
                    videoElement.muted = false;
                    videoElement.volume = 1.0;
                    const p3 = videoElement.play();
                    if (p3 && p3.then) await p3;
                } catch (e) {
                    console.warn('Enable audio click failed', e);
                }
                // remove button after attempt
                try { btn.remove(); } catch (e) { }
            });
            document.body.appendChild(btn);
        }
        return false;
    }
}

// Volume control mapping for slider years
const YEAR_MIN = 1979;
const YEAR_MAX = 2023;

function computeVolumeFromYear(year) {
    const y = Number(year);
    if (Number.isNaN(y)) return 1.0;
    const t = (y - YEAR_MIN) / (YEAR_MAX - YEAR_MIN);
    // volume 1.0 at YEAR_MIN, 0.0 at YEAR_MAX
    return 1.0 - THREE.MathUtils.clamp(t, 0, 1);
}

// Call this from your slider change handler. Exports the function so other scripts can call it.
export function setVideoVolumeForYear(year) {
    try {
        if (!videoElement) createVideoBackground();
        const vol = computeVolumeFromYear(year);
        if (!videoElement) return;

        if (vol <= 0.0001) {
            // mute to be explicit
            videoElement.volume = 0;
            videoElement.muted = true;
        } else {
            // slider interaction is a user gesture; unmute and set volume
            videoElement.muted = false;
            // clamp volume to [0,1]
            videoElement.volume = Math.max(0, Math.min(1, vol));
            // ensure playback (may be required if autoplay was prevented initially)
            const p = videoElement.play();
            if (p && p.then) p.catch(() => { /* ignore play failures */ });
        }
    } catch (err) {
        console.warn('Error updating video volume for year', year, err);
    }
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

    // create async video background (non-blocking)
    createVideoBackground();
    // attempt to autoplay with sound (best-effort). If blocked, a button will appear.
    // don't await here to avoid blocking init.
    setTimeout(() => { try { attemptAutoplayWithSound(); } catch (e) { /* ignore */ } }, 50);

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
        // update the background size/position to match new camera distance
        updateVideoPlaneScale();
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

    // handle window resize to update renderer, camera and background plane
    window.addEventListener('resize', () => {
        if (!threeContainer) return;
        camera.aspect = threeContainer.clientWidth / threeContainer.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
        updateVideoPlaneScale();
    });

    animate();
}
