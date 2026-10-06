/* Shared-clock replay for the enlarged Figure 2(A) grounding view. */
(()=>{
 const real=document.getElementById('ft-real-video');
 const twin=document.getElementById('ft-twin-video');
 if(!real||!twin)return;
 const active=()=>!!real.closest('.slide.active')&&!document.hidden;
 function sync(force=false){
  twin.playbackRate=real.playbackRate;
  if(Number.isFinite(twin.duration)&&(force||Math.abs(twin.currentTime-real.currentTime)>.12)){
   twin.currentTime=Math.min(real.currentTime,twin.duration);
  }
 }
 real.addEventListener('play',()=>{sync(true);if(active())twin.play().catch(()=>{})});
 real.addEventListener('pause',()=>twin.pause());
 real.addEventListener('timeupdate',()=>sync());
 ['seeking','seeked','loadedmetadata','ratechange'].forEach(event=>real.addEventListener(event,()=>sync(true)));
 twin.addEventListener('loadedmetadata',()=>sync(true));
 twin.addEventListener('play',()=>{if(active()&&real.paused)real.play().catch(()=>{})});
 twin.addEventListener('pause',()=>{if(active()&&!real.paused)real.pause()});
 addEventListener('deckchange',()=>{if(active())sync(true)});
})();
