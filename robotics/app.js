'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const escapeHTML = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const highlight = s => s.split('\n').map(line => {
  const tokens = line.match(/#[^\n]*|"[^"\n]*"|'[^'\n]*'|\b(?:if|else|return|for|in|and|not|True|False|await)\b|[^#"'\w]+|\w+|./g) || [];
  return tokens.map(t => {const cls=t.startsWith('#')?'tok-comment':/^["']/.test(t)?'tok-string':/^(if|else|return|for|in|and|not|True|False|await)$/.test(t)?'tok-key':'';return cls?`<span class="${cls}">${escapeHTML(t)}</span>`:escapeHTML(t)}).join('');
}).join('\n');

const architectures = {
 rsi: {type:'Fixed coding agent',model:'Coding model serves independent worker contexts',detail:'Each worker has its own task context.',dispatch:'Task allocation · private workspace per worker',workspace:'Private code + skills',gather:'Gather traces, local edits and task outcomes between passes',updater:'Fixed improver model',label:'Merge, test and prune code and skills',update:'Distribute the updated notes and skills to the next pass.',equation:'Wₖ₊₁ = Improve(Wₖ, traces, feedback)',note:'Implemented in simulation: workers execute independently, inspect peer work and exchange tips through a shared bulletin. Between passes, consolidation merges, tests and prunes code and notes. This diagram shows logical instances, not a one-GPU-per-worker allocation.'},
 rl: {type:'Proposed trainable backend',model:'Trainable coding agent + rollout sampler',detail:'Proposed extension · not evaluated in ASENA.',dispatch:'Sample programs · preserve per-episode context',workspace:'Episode execution workspace',gather:'Collect multimodal trajectories, tool results, rewards and termination',updater:'Proposed training adapter',label:'Learner updates the coding agent’s weights',update:'Publish a versioned checkpoint and refresh the rollout samplers.',equation:'rollouts → rewards → learner → θₖ₊₁',note:'Proposed relationship only: reuse workspace execution and simulation interaction, replace code consolidation with a weight update. A trainable sampler, reward and termination records, and checkpoint synchronization would still need implementation.'}
};
$$('[data-mode]').forEach(b=>b.addEventListener('click',()=>{
 const mode=b.dataset.mode,x=architectures[mode];
 $$('[data-mode]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));
 $('[data-worker-mode]').dataset.workerMode=mode;
 const fields={'model-type':'type','model-label':'model','model-detail':'detail','dispatch-label':'dispatch','gather-label':'gather','updater-type':'updater','updater-label':'label','updater-detail':'update','update-equation':'equation','architecture-note':'note'};
 Object.entries(fields).forEach(([id,key])=>$('#'+id).textContent=x[key]);
 $$('.workspace-name').forEach(n=>n.textContent=x.workspace);
 $$('.worker-num').at(-1).textContent=mode==='rsi'?'…16':'…N';
}));
const loopStages=[
 ['01 / Physical grounding','A twin tied to the real workstation.','Reconstruct the scene so task attempts and failure recovery can be explored before returning to hardware.','a reconstructed environment for task and recovery exploration.'],
 ['02 / Agent exploration','Try, diagnose, write a correction, test again.','The coding agent attempts the task, identifies a failure and develops a corrective program. Execution feedback tells it whether to revise the approach or keep the solution.','successful task and recovery trajectories; tested recovery programs.'],
 ['03 / Reusable capability','One discovery, two forms of reuse.','Keep the program in a recovery library. Use successful task and recovery trajectories to train separate policies with different language-conditioned objectives.','task policy π, recovery policy ρ, and reusable recovery programs.'],
 ['04 / Physical validation','Restore a workable scene and continue.','The real-robot controller invokes a learned recovery, checks whether the scene is workable, and resumes the task. If recovery is unavailable or unsuccessful, a human demonstration enters the learning loop.','verified real experience; new failures that guide the next skill and training round.']
];
$$('[data-loop]').forEach(b=>b.addEventListener('click',()=>{
 $$('[data-loop]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));
 const x=loopStages[Number(b.dataset.loop)];
 const v=$('#loop-video'), gallery=Number(b.dataset.loop)>=2, src=gallery?'media/recovery-skills-focused.mp4':'media/digital-twin-rings.mp4';
 if(v.getAttribute('src')!==src){v.pause();v.src=src;v.poster=gallery?'media/recovery-skills-focused.jpg':'media/digital-twin-rings.jpg';v.load();}
 $('#loop-media-caption').textContent=gallery?'Simulated recovery programs (blue) paired with learned real-world recoveries (green).':'Recorded digital-twin demo with the real camera inset.';
 $('#loop-label').textContent=x[0];$('#loop-title').textContent=x[1];$('#loop-copy').textContent=x[2];$('#loop-output').innerHTML='<strong>Output:</strong> '+escapeHTML(x[3]);
}));

const demos={
 asena:{
  src:'media/a-silent-errand.mp4',poster:'media/a-silent-errand-opening.jpg',kind:'Recorded G1 · operator supervised',task:'Check whether the machine has my snack. Report back silently.',scene:'Desk → vending machine → person',speed:1,
  provenance:'ASENA source: a 33-second edited snack-errand replay. The camera portion is cropped in the browser from the original-quality export, without recompression. The world view and motions are recorded; the original coding view is reconstructed from the recording and source. The final notes step depicts retained state; cross-pass skill revision is evaluated separately.',
  turns:[
   {start:0,end:6,title:'Remember what the person is asking for.',observation:'A person points out the snack on the desk.',decision:'Inspect the label and retain a visual reference before leaving.',code:'image = observe_desk()\nsnack = crop_and_inspect(image)\nmemory["target"] = "SunChips"',feedback:'The desk image identifies the red SunChips bag.',memory:'target = SunChips · reference = desk image',label:'Remember'},
   {start:6,end:12,title:'Choose the next useful viewpoint.',observation:'The route and local geometry are available; the machine still needs inspection.',decision:'Use the map to approach the vending machine, then inspect its shelves.',code:'route = plan_from_local_geometry()\nexecute_route(route)\nshelves = observe_machine()',feedback:'The robot reaches a view of the vending-machine shelves.',memory:'target = SunChips · route + shelf observations',label:'Navigate'},
   {start:12,end:16,title:'Match the evidence to the remembered target.',observation:'Saved shelf images contain a matching red bag.',decision:'Compare against the desk reference; preserve the shelf evidence for later questions.',code:'match = compare(memory["target"], shelves)\nsave("shelf_images", shelves)\nanswer = match.found',feedback:'A matching SunChips bag is visible.',memory:'SunChips found · shelf images retained',label:'Verify'},
   {start:16,end:22,title:'Turn the answer into a checked action.',observation:'The match is confirmed, and the robot is back beside the person.',decision:'Validate the gesture, then execute with operator approval.',code:'motion = prepare_gesture("yes")\nreport = check_motion(motion)\nif report.ok and operator_approved():\n    execute(motion)',feedback:'The robot communicates “yes” with a recorded body gesture.',memory:'SunChips → yes · reference + shelf evidence retained',label:'Answer'},
   {start:22,end:27,title:'A follow-up changes the question.',observation:'The person asks about a Pringles can.',decision:'Reuse the saved shelf images instead of repeating the entire errand.',code:'target = inspect_followup()\nshelves = load("shelf_images")\nanswer = compare(target, shelves)',feedback:'No Pringles appear in the saved shelf evidence.',memory:'new target = Pringles · same shelf observations reused',label:'Reinspect'},
   {start:27,end:31,title:'Communicate the updated answer.',observation:'The follow-up target has no match in the recorded views.',decision:'Check and execute the “no” gesture for the new question.',code:'motion = prepare_gesture("no")\nif check_motion(motion).ok:\n    request_approval_and_execute(motion)',feedback:'The robot gestures “no” beside the person.',memory:'SunChips → yes · Pringles → no',label:'Respond'},
   {start:31,end:33,title:'Keep the useful context.',observation:'The errand and follow-up are complete.',decision:'Retain the observations and outcome for a later program.',code:'retain_notes(\n    targets=["SunChips", "Pringles"],\n    evidence=shelves, outcomes=[True, False]\n)',feedback:'The next interaction can start from retained evidence. Cross-pass skill revision is the separate RSI loop.',memory:'notes + evidence persist · model weights unchanged',label:'Retain'}
  ]
 },
 recova:{
  src:'media/station-43-top.mp4',poster:'media/station-43-top.webp',kind:'Recorded station 43 · real robot',task:'Run the task. Restore the scene when a failure blocks progress.',scene:'Station 43 · native camera view',speed:.5,
  provenance:'Recova source: station 43 in the project collection replay. Recorded event times are 402.419s (task), 448.487s (failure), 450.522s (recovery invoked), 468.710s (restored) and 473.021s (task resumes). The source video condenses 750s to 75s. This panel plays selected intervals at half that speed (5× real time) and holds for reading. Event messages are site replay summaries, not raw agent tool calls. The camera source is native 480×360; it has not been upscaled.',
  turns:[
   {start:40.2419,end:41.9,title:'Execute the task and keep watching.',observation:'A rollout is active at workstation 43.',decision:'Let the task policy act while the monitor checks its progress.',code:'run_task_policy(station=43)\nverdict = monitor_recent_observations()',feedback:'Task execution continues; the next selected event detects a failure.',memory:'station = 43 · mode = task · monitor active',label:'Run'},
   {start:44.8487,end:45.0522,title:'A failure requires a different behavior.',observation:'The recorded monitor detects a failure at 448.487s.',decision:'Evaluate recovery rather than repeatedly retrying the blocked task.',code:'if verdict.intervention_needed:\n    pause_task_policy()\n    recovery = choose_applicable_recovery()',feedback:'The next recorded decision invokes the recovery policy.',memory:'task paused · failure under evaluation',label:'Detect'},
   {start:45.0522,end:46.871,title:'Invoke the learned recovery.',observation:'A recovery policy is selected at 450.522s.',decision:'Run the corrective behavior to restore a workable scene.',code:'run_recovery_policy(recovery)\nrestoration = inspect_scene()',feedback:'A restoration check follows the executed recovery.',memory:'mode = recovery · scene restoration pending',label:'Recover'},
   {start:46.871,end:47.3021,title:'Verify before returning to the task.',observation:'Recovery is verified at 468.710s.',decision:'Only resume after the scene is judged workable again.',code:'if restoration.workable:\n    prepare_task_restart()\nelse:\n    request_human_demonstration()',feedback:'The recorded controller prepares to resume the task policy.',memory:'scene restored · task restart allowed',label:'Verify'},
   {start:47.3021,end:49.8,title:'Continue collecting the next attempt.',observation:'The task policy resumes at 473.021s.',decision:'Return control to the task policy and keep monitoring.',code:'resume_task_policy()\ncontinue_monitoring()\n# Verified experience feeds later training.',feedback:'Collection continues. Policies are updated between rounds, not during this clip.',memory:'mode = task · reusable recovery has avoided this handoff',label:'Resume'}
  ]
 }
};
let project=document.body.dataset.view==='recova'?'recova':'asena';
let turn=0,playing=false,stepStarted=0,pausedElapsed=0,raf=0,stepVideoDone=false,seekTarget=0,mediaGeneration=0,stepSeeking=false;
const video=$('#demo-video');
function elapsed(){return pausedElapsed+(playing?performance.now()-stepStarted:0)}
function clock(t){return String(Math.floor(t/60)).padStart(2,'0')+':'+String(Math.floor(t%60)).padStart(2,'0')}
function syncButtons(){
 $('#replay-play').textContent=playing?'Ⅱ Pause':'▶ Play sequence';
 $('#replay-prev').disabled=turn===0;$('#replay-next').disabled=turn===demos[project].turns.length-1;
 $('#replay-status').textContent=playing?'Playing · each turn holds for reading':'Paused · advance at your own pace';
}
function tryPlay(){if(playing&&!stepVideoDone&&!stepSeeking&&video.readyState>=2)video.play().catch(()=>{});}
function seek(t){
 seekTarget=t;stepSeeking=true;
 if(video.readyState>=1){if(Math.abs(video.currentTime-t)<.015){stepSeeking=false;tryPlay();}else video.currentTime=t;}
}
video.addEventListener('loadedmetadata',()=>{video.playbackRate=demos[project].speed;seek(seekTarget);});
video.addEventListener('seeked',()=>{stepSeeking=false;tryPlay();});
video.addEventListener('canplay',tryPlay);
video.addEventListener('error',()=>{$('.media-error').hidden=false;});
function renderTurn(index){
 turn=index;const d=demos[project],s=d.turns[turn];
 stepVideoDone=false;pausedElapsed=0;stepStarted=performance.now();
 $('#turn-number').textContent=`TURN ${String(turn+1).padStart(2,'0')} / ${String(d.turns.length).padStart(2,'0')}`;
 $('#turn-title').textContent=s.title;$('#turn-observation').textContent=s.observation;$('#turn-decision').textContent=s.decision;$('#turn-code').innerHTML=highlight(s.code);$('#turn-feedback').textContent=s.feedback;$('#turn-memory').textContent=s.memory;
 $$('#turn-buttons button').forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===turn));b.classList.toggle('completed',i<turn)});
 video.pause();seek(s.start);$('#demo-clock').textContent=clock(s.start);syncButtons();
}
function switchDemo(name){
 project=name;mediaGeneration++;playing=false;pausedElapsed=0;video.pause();cancelAnimationFrame(raf);
 const d=demos[name];$$('[data-demo]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.demo===name)));
 $('#panel-mode').textContent=name==='asena'?'Code as Policy':'Recovery orchestration';
 $('#original-replay').href=d.src;
 $('#demo-task').textContent=d.task;$('#demo-kind').textContent=d.kind;$('#demo-scene').textContent=d.scene;$('#demo-provenance').textContent=d.provenance;
 $('.media-error').hidden=true;video.classList.toggle('station',name==='recova');$('.recording-viewport').classList.toggle('asena-crop',name==='asena');$('.recording-viewport').classList.toggle('station-view',name==='recova');video.poster=d.poster;video.src=d.src;video.preload='metadata';video.load();
 $('#turn-buttons').replaceChildren(...d.turns.map((s,i)=>{const b=document.createElement('button');b.type='button';b.textContent=String(i+1).padStart(2,'0');b.setAttribute('aria-label',`Turn ${i+1}: ${s.label}`);b.title=s.label;b.addEventListener('click',()=>{pause();renderTurn(i)});return b}));
 renderTurn(0);
}
function pause(){if(playing){pausedElapsed=elapsed();playing=false;}video.pause();cancelAnimationFrame(raf);syncButtons();}
function play(){if(playing){pause();return}playing=true;stepStarted=performance.now();syncButtons();tryPlay();raf=requestAnimationFrame(tick);}
function tick(){
 if(!playing)return;
 const s=demos[project].turns[turn];
 if(!stepSeeking&&video.currentTime>=s.end-.04){video.pause();stepVideoDone=true;}
 $('#demo-clock').textContent=clock(video.currentTime);
 // A minimum readable dwell is independent of the source recording's speed.
 // Never advance a still-loading segment before its actual footage finishes.
 const unavailable=video.error;
 if((stepVideoDone||unavailable)&&elapsed()>=7000){
  if(turn<demos[project].turns.length-1)renderTurn(turn+1);
  else{pause();$('#replay-status').textContent='Sequence complete · replay or select a turn';return;}
 }
 raf=requestAnimationFrame(tick);
}
$$('[data-demo]').forEach(b=>b.addEventListener('click',()=>switchDemo(b.dataset.demo)));
$('#replay-play').addEventListener('click',()=>{if(!playing&&stepVideoDone&&turn===demos[project].turns.length-1)renderTurn(0);play()});
$('#replay-prev').addEventListener('click',()=>{pause();renderTurn(Math.max(0,turn-1))});
$('#replay-next').addEventListener('click',()=>{pause();renderTurn(Math.min(demos[project].turns.length-1,turn+1))});
$('#replay-reset').addEventListener('click',()=>{pause();renderTurn(0)});
video.addEventListener('timeupdate',()=>$('#demo-clock').textContent=clock(video.currentTime));
// Keep clips bounded even if the tab is throttled.
video.addEventListener('timeupdate',()=>{const s=demos[project].turns[turn];if(!stepSeeking&&video.currentTime>=s.end-.03){video.pause();stepVideoDone=true;}});
const replayVisibility=new IntersectionObserver(es=>{if(!es[0].isIntersecting)pause()},{threshold:0});replayVisibility.observe($('.replay-shell'));
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();$$('.inline-video').forEach(v=>v.pause())}});
switchDemo(project);

// Local media: no background downloads or automatic playback as the page opens.
$$('.inline-video').forEach(v=>{v.addEventListener('play',()=>{pause()});new IntersectionObserver(es=>{if(!es[0].isIntersecting)v.pause()}).observe(v)});
const chapters=$$('.chapter');
let scheduled=false;
function updateScroll(){scheduled=false;const max=document.documentElement.scrollHeight-innerHeight;$('#reading-progress').style.width=(max>0?100*scrollY/max:0)+'%';let active=chapters[0]?.id;for(const s of chapters){if(s.getBoundingClientRect().top<170)active=s.id;}$$('.topbar nav a').forEach(a=>a.classList.toggle('active',a.hash==='#'+active));}
addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(updateScroll)}},{passive:true});addEventListener('resize',updateScroll);updateScroll();
$('#focus').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{}});

// Load the richer recorded-data view only when the reader approaches it.
const experienceRecorder = document.querySelector('#experience-recorder');
if (experienceRecorder) {
 const pauseRecorder = () => experienceRecorder.contentWindow?.postMessage({type:'asena-recorder-pause'}, location.origin);
 addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== experienceRecorder.contentWindow) return;
  if (event.data?.type === 'asena-recorder-height') {
   const height = Number(event.data.height);
   if (Number.isFinite(height) && height >= 250 && height <= 3000) experienceRecorder.height = String(Math.ceil(height));
  }
 });
 new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && !experienceRecorder.hasAttribute('src')) experienceRecorder.src = experienceRecorder.dataset.src;
 }, {rootMargin:'250px'}).observe(experienceRecorder);
 new IntersectionObserver(entries => {
  if (!entries[0].isIntersecting) pauseRecorder();
 }).observe(experienceRecorder);
 document.addEventListener('visibilitychange', () => {if (document.hidden) pauseRecorder();});
}

// Preserve direct links to supporting material without expanding it by default.
function revealTutorialDetail() {
 let id;
 try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
 const target = document.getElementById(id);
 if (!target) return;
 const detail = target.matches('details') ? target : target.closest('details');
 if (detail) { detail.open = true; requestAnimationFrame(() => target.scrollIntoView({block:'start'})); }
}
addEventListener('hashchange', revealTutorialDetail);
revealTutorialDetail();
