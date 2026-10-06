import * as THREE from 'three';
import { OrbitControls } from './assets/vendor/OrbitControls.js?v=b97879c748';
import { GLTFLoader } from './assets/vendor/GLTFLoader.js?v=adbbafe8ce';
import { createMotionPlayer } from './replay.js?v=2a2387b5cf';
import { loadTwinAssets } from './twin-assets.js?v=db44c65a02';

// Saved body transforms play against the camera video's clock; no physics server is needed.
export function createViewer(canvas, { timeSource, onContextLost } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  const viewport = canvas.parentElement;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e9eee4');
  const camera = new THREE.PerspectiveCamera(39, 1, .01, 50);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = .08;
  controls.minDistance = .22;
  controls.maxDistance = 4;
  controls.maxPolarAngle = Math.PI * .88;
  controls.autoRotateSpeed = .7;
  controls.autoRotate = true;
  controls.enablePan = true;
  controls.zoomToCursor = true;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a9d76, 1.8));
  const light = new THREE.DirectionalLight(0xffffff, 2.4);
  light.position.set(-2, 4, 2); scene.add(light);
  const fill = new THREE.DirectionalLight(0xe5f1ff, .8);
  fill.position.set(2, 2, -2); scene.add(fill);
  const loader = new GLTFLoader();
  let currentObject, currentTwin, motion, visible = false, frame = 0, previousFrame = 0, disposed = false;
  let renderWidth = 0, renderHeight = 0, renderPixelRatio = 0;
  let requests = new AbortController(), loadVersion = 0;

  function resize() {
    // Size the drawing buffer from the frame, independently of the canvas's
    // intrinsic dimensions and the browser's percentage-height resolution.
    const bounds = viewport.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    const width = Math.round(bounds.width), height = Math.round(bounds.height);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    if (width === renderWidth && height === renderHeight && pixelRatio === renderPixelRatio) return;
    if (pixelRatio !== renderPixelRatio) renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    renderWidth = width; renderHeight = height; renderPixelRatio = pixelRatio;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(viewport);
  window.addEventListener('resize', resize, { passive: true });
  function tick(now) {
    if (!visible || document.hidden) { frame = 0; return; }
    const delta = previousFrame ? Math.min((now - previousFrame) / 1000, .1) : 0;
    previousFrame = now;
    if (timeSource) motion?.setTime(timeSource());
    controls.update(delta);
    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  }
  function setVisible(value) {
    visible = value && !disposed;
    if (visible && !frame) { resize(); previousFrame = 0; frame = requestAnimationFrame(tick); }
    if (!visible && frame) { cancelAnimationFrame(frame); frame = 0; previousFrame = 0; }
  }
  function reset() {
    if (!currentTwin) return;
    camera.position.fromArray(currentTwin.camera);
    controls.target.fromArray(currentTwin.target);
    controls.update(0);
  }
  function zoom(factor) {
    const offset = camera.position.clone().sub(controls.target);
    const distance = THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance);
    camera.position.copy(controls.target).add(offset.setLength(distance));
    controls.update(0);
  }
  function onKeyDown(event) {
    if (['+', '=', '-', '_'].includes(event.key)) { event.preventDefault(); zoom(event.key === '+' || event.key === '=' ? .85 : 1.18); return; }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') { reset(); return; }
    const orbit = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    if (event.key === 'ArrowLeft') orbit.theta -= .12;
    if (event.key === 'ArrowRight') orbit.theta += .12;
    if (event.key === 'ArrowUp') orbit.phi = Math.max(.08, orbit.phi - .1);
    if (event.key === 'ArrowDown') orbit.phi = Math.min(controls.maxPolarAngle, orbit.phi + .1);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(orbit));
    controls.update(0);
  }
  function contextLost(event) {
    event.preventDefault(); setVisible(false);
    onContextLost?.();
  }
  canvas.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('webglcontextlost', contextLost);
  function disposeObject(object) {
    const geometries = new Set(), materials = new Set(), textures = new Set();
    object?.traverse(node => {
      if (node.geometry) geometries.add(node.geometry);
      if (node.material) (Array.isArray(node.material) ? node.material : [node.material]).forEach(material => materials.add(material));
    });
    materials.forEach(material => {
      Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value); });
      material.dispose();
    });
    geometries.forEach(geometry => geometry.dispose());
    textures.forEach(texture => texture.dispose());
  }
  return {
    async load(twin, assets) {
      const version = ++loadVersion;
      requests.abort();
      requests = new AbortController();
      const { signal } = requests;
      if (currentObject) { scene.remove(currentObject); disposeObject(currentObject); }
      currentObject = currentTwin = motion = undefined;
      let object;
      try {
        const modelURL = new URL(twin.model, document.baseURI);
        const { modelBuffer, metadata, buffer } = assets || await loadTwinAssets(twin, signal);
        const gltf = await loader.parseAsync(modelBuffer, new URL('.', modelURL).href);
        object = gltf.scene;
        if (disposed || version !== loadVersion || signal.aborted) throw new DOMException('Scene load cancelled.', 'AbortError');
        // Flat reconstruction backdrops would obscure the task as the camera orbits.
        ['backdrop', ...(twin.hiddenNodes || [])].forEach(name => {
          const backdrop = object.getObjectByName(name);
          if (backdrop) backdrop.visible = false;
        });
        // Keep appearance adjustments specific to the selected parts and scene.
        Object.entries(twin.materialColors || {}).forEach(([name, color]) => {
          object.getObjectByName(name)?.traverse(node => {
            if (!node.isMesh) return;
            const recolor = material => {
              const copy = material.clone();
              copy.color?.set(color);
              return copy;
            };
            node.material = Array.isArray(node.material) ? node.material.map(recolor) : recolor(node.material);
          });
        });
        const nextMotion = createMotionPlayer(object, metadata, new Float32Array(buffer));
        currentTwin = twin;
        currentObject = object;
        motion = nextMotion;
        scene.add(currentObject);
        reset(); resize();
        renderer.render(scene, camera);
        return { duration: motion.duration };
      } catch (error) {
        if (object && object !== currentObject) disposeObject(object);
        throw error;
      }
    },
    reset, zoom, setVisible,
    autoRotate(value) { controls.autoRotate = value; },
    setTime(time) { motion?.setTime(time); },
    dispose() {
      disposed = true;
      loadVersion += 1;
      setVisible(false);
      requests.abort();
      resizeObserver.disconnect();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('webglcontextlost', contextLost);
      controls.dispose();
      disposeObject(currentObject);
      renderer.dispose();
    },
  };
}
