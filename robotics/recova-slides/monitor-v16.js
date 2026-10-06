/* Illustrative monitor phases, synchronized to the authentic recovery clip.
   These are explanatory labels, not recorded model outputs or query timing. */
(() => {
  'use strict';
  const video = document.getElementById('mv16-recovery-video');
  const composition = video?.closest('.mv16-composition');
  if (!video || !composition) return;
  const queries = [...composition.querySelectorAll('[data-monitor-query]')];
  const restoration = composition.querySelector('#mv16-restoration-value');
  let previous = null;
  function update() {
    const time = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    const phase = time < 1.4 ? 'requirement' : time < 2.8 ? 'completion' : time < 8.4 ? 'intervention' : 'restoration';
    if (phase === previous) return;
    previous = phase;
    composition.dataset.monitorPhase = phase;
    queries.forEach(query => query.classList.toggle('is-current', query.dataset.monitorQuery === phase));
    restoration.textContent = phase === 'restoration' ? 'Scene ready to resume' : 'Awaiting correction';
  }
  ['loadedmetadata','timeupdate','seeking','seeked','emptied'].forEach(event => video.addEventListener(event, update));
  window.addEventListener('deckchange', update);
  update();
})();
