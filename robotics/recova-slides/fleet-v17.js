/* One recording clock for the external view and the four actual YAM cameras. */
(() => {
  const root = document.querySelector('.fleet-v17 [data-collection-v16]');
  if (!root) return;
  const slide = root.closest('.slide');
  const master = root.querySelector('.mv16-master video');
  const stations = [...root.querySelectorAll('.fv17-station')];
  const cameras = stations.map(station => station.querySelector('video'));
  const videos = [master, ...cameras];
  const managedPauses = new WeakSet();
  let manifest = null, wantsPlayback = !master.paused, tickId = 0, lastSync = 0, failed = false;
  const visible = () => slide.classList.contains('active') && !document.hidden;
  function pauseAll() {
    videos.forEach(video => { if (!video.paused) { managedPauses.add(video); video.pause(); } });
  }
  function align(force = false) {
    cameras.forEach(video => {
      video.playbackRate = master.playbackRate;
      if (video.readyState < 1 || !Number.isFinite(video.duration)) return;
      const target = Math.max(0, Math.min(master.currentTime, video.duration - .001));
      if (!video.seeking && (force || Math.abs(video.currentTime - target) > .08)) video.currentTime = target;
    });
  }
  function ready() { return videos.every(video => video.readyState >= 3 && !video.seeking); }
  function pump() {
    if (failed || !visible() || !wantsPlayback) { pauseAll(); return; }
    videos.forEach(video => { video.preload = 'auto'; if (video.networkState === 0) video.load(); });
    if (!ready()) { pauseAll(); return; }
    videos.forEach(video => {
      if (video.paused) video.play().catch(error => {
        if (error.name === 'NotAllowedError') { wantsPlayback = false; pauseAll(); }
      });
    });
    if (!tickId) tickId = requestAnimationFrame(tick);
  }
  function stateAt(station, time) {
    let state = station.states[0];
    for (const next of station.states) { if (next.time > time) break; state = next; }
    return state;
  }
  function paint() {
    const selected = Number(root.querySelector('.mv16-selected').textContent);
    const time = master.currentTime * (manifest?.mediaTimeScale || 10);
    stations.forEach((figure, i) => {
      figure.classList.toggle('is-selected', i + 1 === selected);
      figure.querySelector('figcaption button').setAttribute('aria-pressed', String(i + 1 === selected));
      const station = manifest?.stations.find(item => item.id === Number(figure.dataset.stationId));
      if (!station) return;
      figure.dataset.status = stateAt(station, time).status;
      const covered = station.coverage.some(([start, end]) => time >= start && time < end);
      const held = figure.querySelector('.fv17-held');
      held.hidden = covered;
      held.textContent = time < station.coverage[0][0] ? 'Waiting' : 'Held frame';
    });
  }
  function tick(now) {
    tickId = 0;
    if (!visible() || !wantsPlayback) return;
    if (now - lastSync >= 250) {
      align(); paint(); lastSync = now;
      if (!ready()) pump();
    }
    if (!master.paused) tickId = requestAnimationFrame(tick);
  }
  master.addEventListener('play', () => {
    wantsPlayback = true; align(); paint(); pump();
  });
  master.addEventListener('pause', () => {
    if (managedPauses.has(master)) { managedPauses.delete(master); return; }
    wantsPlayback = false; pauseAll();
  });
  master.addEventListener('seeking', () => { pauseAll(); align(true); paint(); });
  master.addEventListener('seeked', () => { align(); paint(); pump(); });
  master.addEventListener('ratechange', () => align());
  master.addEventListener('timeupdate', paint);
  cameras.forEach(video => {
    video.addEventListener('pause', () => {
      if (managedPauses.has(video)) { managedPauses.delete(video); return; }
      // A direct camera pause is also a group pause; managed buffer pauses keep intent.
      if (visible() && wantsPlayback) { wantsPlayback = false; pauseAll(); }
    });
    video.addEventListener('play', () => { if (!visible() || !wantsPlayback) pauseAll(); else pump(); });
  });
  videos.forEach(video => {
    video.muted = true; video.loop = true; video.playsInline = true;
    ['loadedmetadata','loadeddata','canplay','seeked'].forEach(name => video.addEventListener(name, () => { align(); paint(); pump(); }));
    video.addEventListener('waiting', () => { if (visible() && wantsPlayback) pauseAll(); });
    video.addEventListener('error', () => { failed = true; wantsPlayback = false; pauseAll(); });
  });
  // Capture before the deck's individual-media click handlers, so every camera is one transport.
  root.addEventListener('click', event => {
    if (!event.target.closest('.media video,.media .play-overlay')) return;
    event.preventDefault(); event.stopImmediatePropagation();
    wantsPlayback = !wantsPlayback;
    if (wantsPlayback) { align(true); pump(); } else pauseAll();
  }, true);
  new MutationObserver(() => {
    if (!visible()) pauseAll(); else if (!master.paused) { wantsPlayback = true; pump(); }
    paint();
  }).observe(slide, {attributes:true, attributeFilter:['class']});
  new MutationObserver(paint).observe(root.querySelector('.mv16-selected'), {childList:true,subtree:true});
  document.addEventListener('visibilitychange', () => { if (!visible()) pauseAll(); else pump(); });
  fetch('assets/media/collection-v16-events.json').then(response => {
    if (!response.ok) throw Error(response.status); return response.json();
  }).then(data => { manifest = data; paint(); }).catch(() => {});
  align(); paint(); pump();
})();
