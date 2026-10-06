/* A presenter-controlled walkthrough of the existing website method diagram. */
(()=>{
 const slide=document.querySelector('.contribution-pipeline');
 if(!slide)return;
 const surface=slide.querySelector('.native-pipeline');
 const svg=slide.querySelector('.pipeline-svg');
 if(!surface||!svg)return;
 const slideIndex=[...document.querySelectorAll('.slide')].indexOf(slide);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const stages=[
  {label:'Build the digital twin',nodes:['agent','twin'],flows:['build']},
  {label:'Develop task and recovery behaviors in simulation',nodes:['twin','base','recovery'],flows:['experience','sim-recovery']},
  {label:'Delegate the physical task',nodes:['agent','base'],flows:['delegate']},
  {label:'Invoke recovery after a failure',nodes:['base','recovery'],flows:['failure']},
  {label:'Resume the task after recovery',nodes:['recovery','base'],flows:['resume']},
  {label:'Request human assistance when recovery is unresolved',nodes:['agent','recovery','human'],flows:['unresolved','handoff']},
  {label:'Learn from task and recovery experience',nodes:['base','recovery','human'],flows:['success','recovery-data']}
 ];
 const nodes=[...svg.querySelectorAll('[data-pipeline-node]')];
 const flows=[...svg.querySelectorAll('[data-flow]')].map(group=>{
  const path=group.querySelector('.flow-base');
  const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');
  dot.setAttribute('r','7');dot.classList.add('flow-traveler');
  group.append(dot);
  return {group,path,dot,length:path.getTotalLength()};
 });
 let frame=0,start=0,step=0;
 function stopMotion(){
  cancelAnimationFrame(frame);frame=0;
  slide.classList.remove('pipeline-motion-running');
 }
 function animate(now){
  if(!step||!slide.classList.contains('active')||document.hidden||reduced.matches){stopMotion();return}
  const progress=((now-start)%2400)/2400;
  flows.forEach(({group,path,dot,length})=>{
   if(!group.classList.contains('flow-active'))return;
   const point=path.getPointAtLength(length*progress);
   dot.setAttribute('cx',point.x);dot.setAttribute('cy',point.y);
  });
  frame=requestAnimationFrame(animate);
 }
 function update(event){
  const state=event?.detail||window.DECK?.state?.();
  if(state?.index===slideIndex)step=Math.max(0,Math.min(stages.length,Number(state.step)||0));
  const selected=stages[step-1];
  nodes.forEach(node=>node.classList.toggle('node-active',!!selected?.nodes.includes(node.dataset.pipelineNode)));
  flows.forEach(({group})=>group.classList.toggle('flow-active',!!selected?.flows.includes(group.dataset.flow)));
  slide.classList.toggle('pipeline-running',!!selected);
  surface.setAttribute('aria-label',`${selected?`Step ${step} of ${stages.length}: ${selected.label}`:'Method overview'}. Click or press Enter to ${step===stages.length?'continue to the next slide':'advance the narrative'}.`);
  stopMotion();
  if(selected&&slide.classList.contains('active')&&!document.hidden&&!reduced.matches){
   slide.classList.add('pipeline-motion-running');start=performance.now();frame=requestAnimationFrame(animate);
  }
 }
 surface.setAttribute('role','button');
 surface.setAttribute('tabindex','0');
 surface.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();if(event.detail<2)window.DECK?.next?.()});
 surface.addEventListener('dblclick',event=>{event.preventDefault();event.stopPropagation()});
 surface.addEventListener('keydown',event=>{
  if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();if(!event.repeat)window.DECK?.next?.()}
 });
 addEventListener('deckchange',update);
 addEventListener('deckstep',update);
 document.addEventListener('visibilitychange',update);
 reduced.addEventListener('change',update);
 update();
})();
