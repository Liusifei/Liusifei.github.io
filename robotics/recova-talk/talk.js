(() => {
  'use strict';
  const slides = [...document.querySelectorAll('.slide')];
  const stage = document.querySelector('#stage');
  const notes = document.querySelector('#notes');
  const query = new URLSearchParams(location.search);
  let index = Math.max(0, Math.min(slides.length - 1, (parseInt(location.hash.slice(1), 10) || 1) - 1));
  let step = 0, manualPause = query.has('preview'), script = [];
  const maxStep = slide => Math.max(0, ...[...slide.querySelectorAll('[data-step]')].map(e => +e.dataset.step));
  function fit() {
    const box = document.querySelector('.stage-wrap').getBoundingClientRect();
    stage.style.transform = `scale(${Math.min(box.width / 1280, box.height / 720)})`;
  }
  function updateNotes() {
    const item = script[index];
    document.querySelector('#notes-title').textContent = `${index + 1}. ${slides[index].dataset.title}`;
    document.querySelector('#notes-copy').textContent = item?.notes || 'Loading speaking notes…';
    document.querySelector('#notes-timing').textContent = `${slides[index].dataset.duration} seconds allocated · ${item?.words || 0} spoken words`;
  }
  function setVideo(video, play) {
    if (play) {
      if (!video.src) { video.src = video.dataset.src; video.load(); }
      video.playbackRate = +(video.dataset.speed || 1);
      video.muted = true;
      video.play().catch(() => { video.controls = true; });
    } else video.pause();
  }
  function updateMedia() {
    slides.forEach((slide, i) => {
      const active = i === index && !manualPause && !document.hidden;
      slide.querySelectorAll('video').forEach(video => setVideo(video, active && !video.closest('.hidden-build')));
      slide.querySelectorAll('iframe').forEach(frame => {
        if (i === index && !frame.src) frame.src = frame.dataset.src;
        frame.contentWindow?.postMessage({type:'recova-playback',active:active && !frame.closest('.hidden-build')}, location.origin);
      });
    });
    document.querySelector('#play-button').textContent = manualPause ? 'Play videos' : 'Pause videos';
    document.body.classList.toggle('paused-videos', manualPause);
  }
  function show(nextIndex, nextStep = 0) {
    index = Math.max(0, Math.min(slides.length - 1, nextIndex));
    step = Math.max(0, Math.min(maxStep(slides[index]), nextStep));
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
      slide.setAttribute('aria-hidden', String(i !== index));
      slide.inert = i !== index;
      slide.querySelectorAll('[data-step]').forEach(build => {
        const visible = i === index && +build.dataset.step <= step;
        build.classList.toggle('visible-build', visible);
        build.classList.toggle('hidden-build', !visible);
      });
    });
    history.replaceState(null, '', `#${index + 1}`);
    document.querySelector('#position').textContent = `${String(index+1).padStart(2,'0')} / 08`;
    document.querySelector('#build-count').textContent = maxStep(slides[index]) ? `${step + 1} / ${maxStep(slides[index]) + 1} builds` : '';
    updateNotes(); updateMedia();
  }
  function next() { if (step < maxStep(slides[index])) show(index, step + 1); else show(index + 1); }
  function previous() { if (step > 0) show(index, step - 1); else if (index > 0) show(index - 1, maxStep(slides[index - 1])); }
  function toggleNotes() { notes.hidden = !notes.hidden; }
  function togglePlayback() { manualPause = !manualPause; updateMedia(); }
  function fullscreen() { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.(); }
  document.querySelector('#prev').addEventListener('click',previous);
  document.querySelector('#next').addEventListener('click',next);
  document.querySelector('#notes-button').addEventListener('click',toggleNotes);
  document.querySelector('#close-notes').addEventListener('click',toggleNotes);
  document.querySelector('#play-button').addEventListener('click',togglePlayback);
  document.querySelector('#fullscreen-button').addEventListener('click',fullscreen);
  const overview = document.querySelector('#overview');
  document.querySelector('#overview-button').addEventListener('click',()=>overview.showModal());
  document.querySelector('#close-overview').addEventListener('click',()=>overview.close());
  slides.forEach((slide,i) => {
    const button=document.createElement('button');
    const number=document.createElement('span'); number.textContent=`${String(i+1).padStart(2,'0')} / ${slide.dataset.duration} sec`;
    button.append(number,document.createTextNode(slide.dataset.title));
    button.addEventListener('click',()=>{overview.close();show(i);});
    document.querySelector('#overview-grid').append(button);
  });
  document.querySelectorAll('video').forEach(video => {
    video.addEventListener('click',()=>video.paused?setVideo(video,true):video.pause());
    video.addEventListener('error',()=>{video.controls=true;video.setAttribute('title','Video unavailable. Open this presentation through a web server.');});
  });
  document.querySelectorAll('iframe').forEach(frame => frame.addEventListener('load',updateMedia));
  document.addEventListener('keydown',event => {
    if (event.target?.matches?.('input,textarea,[contenteditable=true]') || overview.open) return;
    if (['ArrowRight','PageDown',' '].includes(event.key)) { event.preventDefault(); event.shiftKey?show(index+1):next(); }
    if (['ArrowLeft','PageUp'].includes(event.key)) { event.preventDefault(); event.shiftKey?show(index-1):previous(); }
    if (event.key.toLowerCase()==='n') toggleNotes();
    if (event.key.toLowerCase()==='p') togglePlayback();
    if (event.key.toLowerCase()==='f') fullscreen();
    if (event.key.toLowerCase()==='o') overview.showModal();
    if (event.key==='Home') show(0);
    if (event.key==='End') show(slides.length-1,maxStep(slides.at(-1)));
  });
  document.addEventListener('visibilitychange',updateMedia);
  window.addEventListener('resize',fit);
  window.addEventListener('message',event=>{
    const frame=document.querySelector('.dashboard-frame iframe');
    if(event.origin!==location.origin || event.source!==frame?.contentWindow || event.data?.type!=='recova-key') return;
    document.dispatchEvent(new KeyboardEvent('keydown',{key:event.data.key,shiftKey:!!event.data.shiftKey}));
  });
  window.addEventListener('hashchange',()=>show((parseInt(location.hash.slice(1),10)||1)-1));
  // Matched real and MuJoCo views share one playback clock.
  const paired = [...document.querySelectorAll('video[data-sync="twin"]')];
  if (paired.length===2) paired[0].addEventListener('timeupdate',()=>{
    if (!paired[0].paused && paired[1].readyState>1 && Math.abs(paired[0].currentTime-paired[1].currentTime)>.18) paired[1].currentTime=paired[0].currentTime;
  });
  fetch('script.json?v=20261006-builds3').then(r=>r.json()).then(data=>{script=data.slides;updateNotes();}).catch(()=>{});
  window.RECOVA_TALK = {show,next,previous,state:()=>({index,step,paused:manualPause}),reveal:()=>show(index,maxStep(slides[index])),pause:()=>{manualPause=true;updateMedia();}};
  fit(); show(index,query.has('all')?maxStep(slides[index]):0);
})();
