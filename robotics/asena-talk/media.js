(() => {
  'use strict';
  const dialog = document.querySelector('#demo-dialog');
  const player = document.querySelector('#demo-video');
  const demos = {
    navigation: {title: 'Observe while navigating', video: 'media/mission-search.mp4', poster: 'media/mission-search.jpg', caption: 'Recorded panoramic observations during a supervised G1 run. The robot sees the scene change as execution proceeds.'},
    gesture: {title: 'Execute an approved gesture', video: 'media/real-wave.mp4', poster: 'media/real-wave.jpg', caption: 'A recorded wave on G1, with operator supervision. The agent proposes motion; the platform retains execution authority.'}
  };
  let resume = [];
  document.querySelectorAll('[data-demo]').forEach(button => button.addEventListener('click', () => {
    const demo = demos[button.dataset.demo];
    if (!demo) return;
    resume = [...document.querySelectorAll('.slide.active video')].filter(video => !video.paused);
    resume.forEach(video => video.pause());
    document.querySelector('#demo-title').textContent = demo.title;
    document.querySelector('#demo-caption').textContent = demo.caption;
    player.poster = demo.poster;
    player.src = demo.video;
    dialog.showModal();
    player.play().catch(() => {});
  }));
  document.querySelector('#demo-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    player.pause();
    resume.filter(video => video.closest('.slide.active')).forEach(video => video.play().catch(() => {}));
    resume = [];
  });
  document.addEventListener('keydown', event => {
    if (!dialog.open) return;
    event.stopImmediatePropagation();
    if (event.code === 'Escape') {event.preventDefault();dialog.close();}
    if (event.code === 'Space' && event.target === dialog) {event.preventDefault();player.paused ? player.play().catch(() => {}) : player.pause();}
  }, true);
  window.addEventListener('asena-slidechange', () => { if (dialog.open) dialog.close(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) player.pause();
    else if (dialog.open) player.play().catch(() => {});
  });
})();
