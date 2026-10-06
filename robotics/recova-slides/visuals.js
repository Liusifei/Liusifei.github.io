/* Media-led interactions adapted to the website assets. No external requests. */
(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const preview=new URLSearchParams(location.search).has('preview');
 const cover=document.querySelector('.hero-film video');
 const hero=cover?.closest('.slide');
 const clearCover=()=>hero?.classList.toggle('library-visible',cover.currentTime>=7.85);
 ['timeupdate','seeked','loadedmetadata','emptied'].forEach(name=>cover?.addEventListener(name,clearCover));
 function active(el){return !!el?.closest('.slide.active')&&!document.hidden}
 let viewer=null,loading=null;
 const twin=document.getElementById('live-twin'),canvas=document.getElementById('twin-canvas'),recording=document.getElementById('twin-video');
 const scene={id:'green-circle',model:'assets/models/green-circle-replay.glb',motion:'assets/twins/green-circle/motion.json',target:[.35,.86,0],camera:[1.35,1.55,1.05]};
 async function loadTwin(){
  if(!twin||!canvas||!recording)return;
  if(viewer){viewer.setVisible(active(canvas));return}
  if(loading)return loading;
  if(location.protocol==='file:'){twin.querySelector('.twin-hint').textContent='Local server enables the interactive twin';return}
  loading=(async()=>{try{
   const {createViewer}=await import('./viewer.js');
   viewer=createViewer(canvas,{timeSource:()=>recording.currentTime,onContextLost:()=>{twin.classList.remove('ready');twin.querySelector('.twin-hint').textContent='Recorded twin preview'}});
   await viewer.load(scene);viewer.autoRotate(!reduced.matches&&!preview);viewer.setVisible(active(canvas));twin.classList.add('ready');
  }catch(e){twin.querySelector('.twin-hint').textContent='Recorded twin preview';twin.dataset.loadError=e.message;}})();
  return loading;
 }
 document.querySelector('.twin-reset')?.addEventListener('click',()=>viewer?.reset());
 canvas?.addEventListener('pointerdown',()=>viewer?.autoRotate(false));
 recording?.addEventListener('seeked',()=>viewer?.setTime(recording.currentTime));
 // Matched top-camera and saved twin footage follow the physical recording's clock.
 const groundingReal=document.getElementById('grounding-real-video');
 const groundingSim=document.getElementById('grounding-sim-video');
 function syncGrounding(force=false){
  if(!groundingReal||!groundingSim)return;
  groundingSim.playbackRate=groundingReal.playbackRate;
  if(Number.isFinite(groundingSim.duration)&&(force||Math.abs(groundingSim.currentTime-groundingReal.currentTime)>.12)){
   groundingSim.currentTime=Math.min(groundingReal.currentTime,groundingSim.duration);
  }
 }
 groundingReal?.addEventListener('play',()=>{syncGrounding(true);if(active(groundingReal))groundingSim?.play().catch(()=>{})});
 groundingReal?.addEventListener('pause',()=>groundingSim?.pause());
 groundingReal?.addEventListener('timeupdate',()=>syncGrounding());
 ['seeking','seeked','loadedmetadata','ratechange'].forEach(e=>groundingReal?.addEventListener(e,()=>syncGrounding(true)));
 groundingSim?.addEventListener('loadedmetadata',()=>syncGrounding(true));
 // Clicking either video controls the pair; navigation still pauses inactive media.
 groundingSim?.addEventListener('play',()=>{if(active(groundingSim)&&groundingReal?.paused)groundingReal.play().catch(()=>{})});
 groundingSim?.addEventListener('pause',()=>{if(active(groundingSim)&&!groundingReal?.paused)groundingReal.pause()});
 // A shared source clock keeps the external recording and four station views aligned.
 const main=document.querySelector('.fleet-main video');
 const stationVideos=[...document.querySelectorAll('.station-view video')];
 let stationData=null;
 if(main&&location.protocol!=='file:')fetch('assets/stations.json').then(r=>r.json()).then(d=>{stationData=d}).catch(()=>{});
 function syncStations(){
  if(!main)return;
  stationVideos.forEach(v=>{if(Number.isFinite(v.duration)&&Math.abs(v.currentTime-main.currentTime)>.18)v.currentTime=Math.min(main.currentTime,v.duration);v.playbackRate=main.playbackRate});
  if(!stationData)return;
  const t=main.currentTime*(stationData.mediaTimeScale||10);
  document.querySelectorAll('.station-view').forEach(el=>{const d=stationData.stations.find(s=>s.id===+el.dataset.station);let state=d?.states?.[0];for(const s of d?.states||[])if(s.time<=t)state=s;else break;const label=el.querySelector('.station-status');if(label&&state){label.textContent=state.label;label.dataset.status=state.status}});
 }
 main?.addEventListener('play',()=>{stationVideos.forEach(v=>v.play().catch(()=>{}));syncStations()});
 main?.addEventListener('pause',()=>stationVideos.forEach(v=>v.pause()));
 ['timeupdate','seeking','seeked'].forEach(e=>main?.addEventListener(e,syncStations));
 function slideChanged(){
  if(active(canvas)&&!location.pathname.endsWith('qa.html'))loadTwin();else viewer?.setVisible(false);
  if(active(groundingReal))syncGrounding(true);
 }
 addEventListener('deckchange',slideChanged);document.addEventListener('visibilitychange',slideChanged);
 // Expose read-only state and a loader for the local validation harness.
 window.RECOVA_VISUALS={loadTwin,get twinReady(){return twin?.classList.contains('ready')},get viewer(){return viewer}};
 slideChanged();
})();
