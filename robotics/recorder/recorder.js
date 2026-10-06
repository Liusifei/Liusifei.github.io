/* ASENA measured-state viewer. Sources and retained upstream notices: NOTICE.txt. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const video = $('#camera'), playButton = $('#play'), scrub = $('#scrub');
  const robotView = $('#robot-view'), status = $('#play-note');
  let data, loaded, renderer, scene, camera, model, root, joints = [];
  let timelineReady = false;
  let playing = false, requestedTime = 0, playRequest = 0, raf = 0, ready3d = false;
  let quaternionA, quaternionB, observedVisible = true;
  const duration = 10;
  function postHeight() {
    if (window.parent !== window) window.parent.postMessage({
      type: 'asena-recorder-height', height: Math.ceil($('.recorder').getBoundingClientRect().height)
    }, location.origin);
  }
  new ResizeObserver(postHeight).observe($('.recorder'));
  window.addEventListener('load', postHeight);
  function setButton() {
    $('#play-label').textContent = playing ? 'Pause' : requestedTime >= duration ? 'Replay' : 'Play';
    $('#play-icon').textContent = playing ? 'Ⅱ' : '▶';
    playButton.setAttribute('aria-label', playing ? 'Pause synchronized recording' : 'Play synchronized recording');
  }
  function pause() {
    playRequest++;
    playing = false;
    video.pause();
    cancelAnimationFrame(raf);
    raf = 0;
    setButton();
  }
  function loadScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'three-replay.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('The 3D renderer could not be loaded.'));
      document.head.append(script);
    });
  }
  function resizeRenderer() {
    if (!renderer || !camera) return;
    const width = robotView.clientWidth, height = robotView.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (ready3d) renderer.render(scene, camera);
  }
  function drawRobot(time) {
    if (!ready3d) return;
    const THREE = window.RecorderThree, motion = data.motion;
    const fractionalIndex = time * motion.sampleRateHz;
    const a = Math.min(200, Math.floor(fractionalIndex)), b = Math.min(200, a + 1), blend = fractionalIndex - a;
    const pos = motion.rootPosition[a].map((v, i) => THREE.MathUtils.lerp(v, motion.rootPosition[b][i], blend));
    root.position.set(pos[0], pos[2], -pos[1]);
    const qa = motion.rootQuaternionWxyz[a], qb = motion.rootQuaternionWxyz[b];
    quaternionA.set(qa[1], qa[3], -qa[2], qa[0]);
    quaternionB.set(qb[1], qb[3], -qb[2], qb[0]);
    root.quaternion.copy(quaternionA).slerp(quaternionB, blend);
    joints.forEach(({node, axis, index}) => node.quaternion.setFromAxisAngle(axis,
      THREE.MathUtils.lerp(motion.q29[a][index], motion.q29[b][index], blend)));
    model.updateMatrixWorld(true);
    renderer.render(scene, camera);
    robotView.dataset.time = time.toFixed(3);
  }
  async function createRobot() {
    const THREE = window.RecorderThree;
    renderer = new THREE.WebGLRenderer({canvas: $('#robot-canvas'), alpha: true, antialias: true, powerPreference: 'low-power'});
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(31, 1, .01, 100);
    quaternionA = new THREE.Quaternion();
    quaternionB = new THREE.Quaternion();
    model = (await new THREE.GLTFLoader().loadAsync(data.model)).scene;
    root = model.getObjectByName(data.meta.rootNode);
    if (!root) throw new Error('G1 root is missing.');
    const microphone = model.getObjectByName('group_mic');
    if (microphone) microphone.visible = false;
    joints = data.meta.joints.map(joint => {
      const node = model.getObjectByName(joint.node);
      if (!node) throw new Error('G1 joint is missing: ' + joint.node);
      return {node, axis: new THREE.Vector3(...joint.axisGltf).normalize(), index: joint.qIndex};
    });
    model.traverse(object => {
      if (object.isMesh && object.material) {
        object.material.roughness = Math.max(object.material.roughness ?? .5, .27);
        object.material.metalness = Math.min(object.material.metalness ?? 0, .55);
      }
    });
    scene.add(model);
    scene.add(new THREE.HemisphereLight(15990760, 4744003, 3));
    // Match the lighting and coordinate mapping of the original ASENA body replay.
    const key = new THREE.DirectionalLight(0xffffff, 3.1); key.position.set(4, 6, 3); scene.add(key);
    const fill = new THREE.DirectionalLight(12375039, 2.4); fill.position.set(-3, 4, -2); scene.add(fill);
    const last = data.motion.rootPosition.at(-1), centerX = last[0] * .5, centerZ = -last[1] * .5;
    camera.position.set(centerX + 3.65, 2.1, centerZ + 3.6);
    camera.lookAt(centerX, .72, centerZ);
    camera.zoom = 1.4;
    ready3d = true;
    resizeRenderer();
    drawRobot(0);
    const floorY = new THREE.Box3().setFromObject(model).min.y - .012;
    const grid = new THREE.GridHelper(7, 28, 0x4f817e, 0x304f59);
    grid.position.y = floorY; grid.material.transparent = true; grid.material.opacity = .45; scene.add(grid);
    const path = data.motion.rootPosition.map(p => new THREE.Vector3(p[0], floorY + .002, -p[1]));
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(path), new THREE.LineBasicMaterial({color: 0x94ded2, transparent: true, opacity: .7})));
    robotView.classList.add('ready');
    robotView.dataset.joints = joints.length;
    $('#body-status').textContent = 'Measured pose · recorded trajectory · 1×';
    new ResizeObserver(resizeRenderer).observe(robotView);
    $('#robot-canvas').addEventListener('webglcontextlost', event => {
      event.preventDefault(); pause(); ready3d = false; robotView.classList.remove('ready');
      $('#body-status').textContent = '3D unavailable · static model preview';
      status.textContent = 'The graphics context was lost. Camera and numeric state remain available; reload to restore 3D.';
    });
  }
  function loadVideo() {
    return new Promise((resolve, reject) => {
      video.addEventListener('loadedmetadata', resolve, {once: true});
      video.addEventListener('error', () => reject(new Error('The recorded camera clip could not be loaded.')), {once: true});
      video.src = 'assets/panorama-walk.mp4';
      video.load();
    });
  }
  function ensureLoaded() {
    if (!loaded) {
      status.textContent = 'Loading the original camera clip and G1 model…';
      $('#body-status').textContent = 'Loading measured body replay…';
      loaded = Promise.all([
        fetch('motion.json').then(response => { if (!response.ok) throw new Error('Motion data could not be loaded.'); return response.json(); }).then(result => { data = result; }),
        loadScript(), loadVideo()
      ]).then(async () => {
        try { await createRobot(); }
        catch (error) {
          ready3d = false;
          $('#body-status').textContent = '3D unavailable · static model preview';
          console.warn('ASENA body replay:', error);
        }
        status.textContent = ready3d
          ? 'Camera and measured body state share the recorded clock. Scrub to inspect any moment.'
          : 'Camera and numeric state are ready. This browser could not initialize the 3D replay.';
        video.currentTime = requestedTime;
        timelineReady = true;
        update(requestedTime);
      }).catch(error => {
        status.textContent = error.message + ' Reload to retry.';
        $('#body-status').textContent = 'Static model preview';
        throw error;
      });
    }
    return loaded;
  }
  function updateSample(time) {
    if (!data) return;
    const motion = data.motion, index = Math.min(200, Math.round(time * motion.sampleRateHz));
    $('#sample-json').textContent = JSON.stringify({
      bag_time_s: +(579 + motion.time[index]).toFixed(2), clip_time_s: motion.time[index], sample_index: index,
      q29_rad: motion.q29[index], root_position_m: motion.rootPosition[index],
      root_quaternion_wxyz: motion.rootQuaternionWxyz[index],
      odometry_position_m: motion.odomPosition[index], odometry_yaw_rad: motion.odomYaw[index]
    }, null, 2);
  }
  function update(time = video.currentTime) {
    const t = Math.min(duration, Math.max(0, time || 0));
    requestedTime = t;
    scrub.value = t;
    scrub.setAttribute('aria-valuetext', t.toFixed(2) + ' seconds of 10 seconds');
    $('#clock').innerHTML = '00:' + t.toFixed(2).padStart(5, '0') + ' <span>/ 00:10</span>';
    $('#bag-time').textContent = (579 + t).toFixed(2);
    const x = 36 + t / duration * 548;
    $('#cursor').setAttribute('x1', x); $('#cursor').setAttribute('x2', x); $('#trace-dot').setAttribute('cx', x);
    if (data) {
      const motion = data.motion, f = t * motion.sampleRateHz;
      const a = Math.min(200, Math.floor(f)), b = Math.min(200, a + 1), blend = f - a;
      const lerp = (v, w) => v * (1 - blend) + w * blend;
      const knee = lerp(motion.q29[a][3], motion.q29[b][3]);
      const pos = motion.rootPosition[a].map((v, i) => lerp(v, motion.rootPosition[b][i]));
      $('#knee').textContent = knee.toFixed(3);
      $('#distance').innerHTML = Math.hypot(pos[0], pos[1]).toFixed(3) + ' <small>m</small>';
      const yaw = (lerp(motion.odomYaw[a], motion.odomYaw[b]) - motion.odomYaw[0]) * 180 / Math.PI;
      $('#yaw').innerHTML = yaw.toFixed(1) + '<small>°</small>';
      $('#sample').innerHTML = String(Math.min(200, Math.round(f))).padStart(3, '0') + '<small> / 200</small>';
      $('#trace-dot').setAttribute('cy', 124 - knee / 1.4 * 108);
      drawRobot(t);
      if ($('#sample-details').open) updateSample(t);
    }
  }
  function tick() {
    update();
    if (playing && !document.hidden && observedVisible) raf = requestAnimationFrame(tick);
  }
  playButton.addEventListener('click', async () => {
    if (playing) { pause(); return; }
    const request = ++playRequest;
    playButton.disabled = true;
    try {
      await ensureLoaded();
      if (request !== playRequest || document.hidden || !observedVisible) return;
      if (requestedTime >= duration - .01) { video.currentTime = 0; update(0); }
      await video.play();
      if (request !== playRequest || document.hidden || !observedVisible) { video.pause(); return; }
      playing = true; setButton(); tick();
    } catch (error) {
      if (data) status.textContent = 'Playback could not start. Press Play to retry or scrub the recording.';
    } finally { playButton.disabled = false; }
  });
  scrub.addEventListener('input', async () => {
    const time = Number(scrub.value);
    pause(); update(time);
    try { await ensureLoaded(); video.currentTime = requestedTime; update(requestedTime); } catch (_) { /* Visible load error above. */ }
  });
  $('#sample-details').addEventListener('toggle', () => {
    if ($('#sample-details').open) updateSample(requestedTime);
    postHeight();
  });
  video.addEventListener('seeked', () => { if (timelineReady) update(); });
  video.addEventListener('timeupdate', () => { if (timelineReady && !playing) update(); });
  video.addEventListener('ended', () => { pause(); update(duration); setButton(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('message', event => {
    if (event.source === window.parent && event.origin === location.origin && event.data?.type === 'asena-recorder-pause') pause();
  });
  new IntersectionObserver(entries => {
    observedVisible = entries[0].isIntersecting;
    if (!observedVisible) pause();
  }, {threshold: 0}).observe($('.recorder'));
  window.addEventListener('pagehide', pause);
  window.addEventListener('beforeprint', pause);
  // Read-only diagnostics for playback QA; no synthetic state enters the recording.
  window.recorderInspect = () => ({time: requestedTime, playing, loaded: !!data, ready3d, jointCount: joints.length,
    videoTime: video.currentTime, root: root?.position.toArray(), joints: joints.map(({node, axis, index}) => ({index,
      angle: 2 * Math.atan2(node.quaternion.x * axis.x + node.quaternion.y * axis.y + node.quaternion.z * axis.z, node.quaternion.w)}))});
})();
