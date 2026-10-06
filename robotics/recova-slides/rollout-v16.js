/* Figure 2(B): each presenter click follows the corresponding spoken paragraph. */
(()=>{
 const stage=document.querySelector('.rl16-stage');
 if(!stage)return;
 const slide=stage.closest('.slide');
 const slideIndex=[...document.querySelectorAll('.slide')].indexOf(slide);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const steps=['overview','execute','human','learn','expand'];
 const labels=['Real-robot rollout and learning overview','Execute, recover, and resume the task','Request a human demonstration','Learn from task and recovery experience','Expand the recovery skill set'];
 let step=0;
 function update(event){
  const state=event?.detail||window.DECK?.state?.();
  if(state?.index===slideIndex)step=Math.max(0,Math.min(steps.length-1,Number(state.step)||0));
  stage.dataset.rolloutStep=steps[step];
  stage.classList.toggle('rl16-paused',document.hidden||reduced.matches||!slide.classList.contains('active'));
  stage.setAttribute('aria-label',`${step?`Step ${step} of ${steps.length-1}: `:''}${labels[step]}. Click or press Enter to ${step===steps.length-1?'continue to the next slide':'advance the narrative'}.`);
 }
 stage.setAttribute('role','button');
 stage.setAttribute('tabindex','0');
 stage.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();if(event.detail<2)window.DECK?.next?.()});
 stage.addEventListener('dblclick',event=>{event.preventDefault();event.stopPropagation()});
 stage.addEventListener('keydown',event=>{
  if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();if(!event.repeat)window.DECK?.next?.()}
 });
 addEventListener('deckchange',update);
 addEventListener('deckstep',update);
 document.addEventListener('visibilitychange',update);
 reduced.addEventListener('change',update);
 update();
})();
