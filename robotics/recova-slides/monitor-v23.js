/* An illustrative agent trace, not recorded model output or harness timing.
   The native clip remains unchanged and independently pausable by the deck. */
(() => {
  'use strict';
  const video = document.getElementById('mc23-recovery-video');
  const composition = video?.closest('.mc23-composition');
  if (!video || !composition) return;
  const fields = Object.fromEntries([...composition.querySelectorAll('[data-control-text]')]
    .map(element => [element.dataset.controlText, element]));
  const queries = [...composition.querySelectorAll('[data-control-query]')];
  const phases = {
    inspect: {
      query: 'intervention', action: 'Diagnose the obstruction',
      observation: 'Ring caught on the peg', command: 'Select a known recovery',
      instruction: '“Push the stuck ring down”', executor: 'Agent selects · policy executes'
    },
    execute: {
      query: 'intervention', action: 'Invoke learned recovery',
      observation: 'Known instruction selected', command: 'Call recovery policy ρ',
      instruction: '“Push the stuck ring down”', executor: 'Learned policy executes the motion'
    },
    verify: {
      query: 'restoration', action: 'Verify readiness to resume',
      observation: 'Ring seated · scene workable', command: 'Next: resume task policy π',
      instruction: 'Continue stacking rings', executor: 'After verification and return to home'
    }
  };
  let previous = '';
  function update() {
    const time = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    const phase = time < 2.8 ? 'inspect' : time < 8.4 ? 'execute' : 'verify';
    if (phase === previous) return;
    previous = phase;
    const content = phases[phase];
    composition.dataset.controlPhase = phase;
    for (const [name, element] of Object.entries(fields)) element.textContent = content[name];
    for (const query of queries) query.classList.toggle('is-current', query.dataset.controlQuery === content.query);
  }
  ['loadedmetadata','timeupdate','seeking','seeked','emptied'].forEach(event => video.addEventListener(event, update));
  window.addEventListener('deckchange', update);
  update();
})();
