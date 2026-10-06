'use strict';
const slides=[...document.querySelectorAll('.slide')];
const mainCount=slides.filter(s=>!s.classList.contains('backup')).length;
const stage=document.getElementById('stage'), notes=document.getElementById('notes');
const isPresenterWindow=new URLSearchParams(location.search).has('presenter');
let index=0,step=0,renderedNoteIndex=-1,controlsTimer,started=Date.now(),autoplay=!new URLSearchParams(location.search).has('preview');
let channel=null;try{channel=new BroadcastChannel('recova-deck')}catch{}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function scriptSteps(i=index){return window.DECK_NOTES[i]?.script?.steps||[]}
function boundedStep(i,value){return Math.max(0,Math.min(scriptSteps(i).length-1,Math.trunc(Number(value))||0))}
function state(){return {index,step,slideId:slides[index].dataset.slideId}}
function savePosition(){const url=new URL(location.href);url.hash=String(index+1);if(step)url.searchParams.set('step',String(step));else url.searchParams.delete('step');history.replaceState(null,'',url)}
function updateStepNotes(scroll=false){
 const steps=scriptSteps();
 document.querySelectorAll('#notes [data-narrative-step]').forEach(p=>{const active=Number(p.dataset.narrativeStep)===step;p.classList.toggle('note-current',active);if(active)p.setAttribute('aria-current','step');else p.removeAttribute('aria-current')});
 document.querySelectorAll('#notes [data-script-step]').forEach(b=>{if(Number(b.dataset.scriptStep)===step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});
 const status=document.querySelector('#notes .note-step-status');if(status&&steps.length)status.textContent=`${step} / ${steps.length-1} · ${steps[step].label}`;
 const back=document.querySelector('#notes [data-cue-action="prev"]');if(back)back.disabled=step===0;
 const nextButton=document.querySelector('#notes [data-cue-action="next"]');if(nextButton)nextButton.textContent=step<steps.length-1?'Next cue →':'Next slide →';
 if(scroll&&document.body.classList.contains('presenter'))document.querySelector('#notes .note-current')?.scrollIntoView({block:'nearest',behavior:'instant'});
}
function setStep(value,broadcast=true){
 const nextStep=boundedStep(index,value);if(nextStep===step)return;
 step=nextStep;savePosition();updateStepNotes(true);
 window.dispatchEvent(new CustomEvent('deckstep',{detail:state()}));
 if(channel&&broadcast)channel.postMessage({type:'step',...state()});
}
function next(){if(step<scriptSteps().length-1)setStep(step+1);else show(index+1)}
function previous(){if(step>0)setStep(step-1);else if(index>0)show(index-1,true,Math.max(0,scriptSteps(index-1).length-1))}
function renderNotes(s,n){
 const script=n.script;
 const spoken=Array.isArray(script?.paragraphs)?script.paragraphs.filter(p=>typeof p==='string'&&p.trim()):[];
 const steps=scriptSteps();
 const cueControls=steps.length?'<div class="note-step-controls"><div class="note-step-status" role="status" aria-live="polite"></div><div><button type="button" data-cue-action="prev">← Previous cue</button><button type="button" data-cue-action="next">Next cue →</button></div></div>':'';
 const narrative=spoken.map((p,paragraph)=>{
  if(!steps.length)return `<p>${esc(p)}</p>`;
  const cueIndex=steps.reduce((last,cue,i)=>cue.paragraph<=paragraph?i:last,0);
  const marked=p.startsWith('[Click]');
  const click=marked?`<button type="button" class="note-click" data-script-step="${cueIndex}" aria-label="Show ${esc(steps[cueIndex].label)}">[Click]</button> `:'';
  return `<p data-narrative-step="${cueIndex}">${click}${esc(marked?p.slice(7).trim():p)}</p>`;
 }).join('');
 const research=(Array.isArray(n.paragraphs)?n.paragraphs:[]).map(p=>`<p>${esc(p)}</p>`).join('')
  +(n.handoff?`<div class="note-handoff"><span class="label">Transition to the next slide</span><p>${esc(n.handoff)}</p></div>`:'')
  +`<p class="note-cite">Source: ${esc(n.source||'')}</p>`;
 const content=spoken.length
  ? `${script.timing?`<p class="note-script-timing"><span>Talk timing</span>${esc(script.timing)}</p>`:''}${cueControls}<section class="note-script" aria-label="Spoken narrative">${narrative}</section>${script.cue?`<aside class="note-silent-cue"><span class="label">Silent presentation cue</span><p>${esc(script.cue)}</p></aside>`:''}<details class="note-research"><summary>Research notes and sources</summary><div class="note-research-body">${research}</div></details>`
  : research;
 document.getElementById('notes-body').innerHTML=`<div class="label">${esc(s.dataset.section)} · ${esc(n.time)} min</div><h2>${esc(s.dataset.title)}</h2>${content}<div class="note-next">${index===mainCount-1?'End of main talk · appendix follows':index+1<slides.length?'Next: '+esc(slides[index+1].dataset.title):'End of deck'}</div>`;
 notes.scrollTop=0;
 renderedNoteIndex=index;
}
function resize(){let w=innerWidth,h=innerHeight;if(document.body.classList.contains('review-mode')){if(innerWidth<900){h=innerHeight*.48}else{w-=document.getElementById('review-panel')?.getBoundingClientRect().width||400}}else if(document.body.classList.contains('presenter'))h-=notes.getBoundingClientRect().height;document.documentElement.style.setProperty('--s',Math.min(w/1600,h/900))}
function show(i,broadcast=true,requestedStep){
 const previousStep=step;
 const target=Math.max(0,Math.min(slides.length-1,i));
 step=boundedStep(target,requestedStep??(target===index?step:0));index=target;
 slides.forEach((s,j)=>{s.classList.toggle('active',j===index);s.setAttribute('aria-hidden',j!==index);s.inert=j!==index;s.querySelectorAll('video').forEach(v=>{if(j!==index){v.pause()}else{v.playbackRate=Number(v.dataset.speed||1);if(autoplay&&!document.hidden)v.play().catch(()=>{})}})});
 savePosition();
 document.getElementById('counter').textContent=index<mainCount?`${index+1} / ${mainCount}`:`B${index-mainCount+1} / ${slides.length-mainCount}`;
 document.getElementById('progress').style.width=`${Math.min((index+1)/mainCount,1)*100}%`;
 const s=slides[index],n=window.DECK_NOTES[index];
 document.title=`Recova — ${index+1}. ${s.dataset.title}`;
 const freshNotes=renderedNoteIndex!==index;
 if(freshNotes)renderNotes(s,n);
 updateStepNotes(step>0&&(freshNotes||previousStep!==step));
 document.querySelectorAll('.overview-item').forEach((el,j)=>el.classList.toggle('current',j===index));
 window.dispatchEvent(new CustomEvent('deckchange',{detail:state()}));
 if(channel&&broadcast)channel.postMessage({type:'slide',...state()});
}
function toggleNotes(){if(document.body.classList.contains('review-mode'))window.RECOVA_REVIEW?.toggle(false);document.body.classList.toggle('presenter');resize();updateStepNotes(step>0)}
function windowUrl(presenter){const url=new URL(location.href);['presenter','review','all','preview','step'].forEach(key=>url.searchParams.delete(key));if(presenter)url.searchParams.set('presenter','1');if(step)url.searchParams.set('step',String(step));url.hash=String(index+1);return url.href}
function openPresentationWindow(){
 if(isPresenterWindow){
  try{if(window.opener&&!window.opener.closed&&window.opener.location.origin===location.origin&&window.opener.DECK){
   window.opener.RECOVA_REVIEW?.toggle(false);
   window.opener.document.body.classList.remove('presenter');
   window.opener.DECK.show(index,true,step);window.opener.DECK.resize();window.opener.focus();return;
  }}catch{}
  window.open(windowUrl(false),'recova-audience','width=1440,height=900')?.focus();
 }else{
  if(document.body.classList.contains('review-mode'))window.RECOVA_REVIEW?.toggle(false);
  document.body.classList.remove('presenter');resize();
  window.open(windowUrl(true),'recova-presenter','width=1440,height=900')?.focus();
 }
}
function toggleOverlay(id){const el=document.getElementById(id);el.classList.toggle('open');if(el.classList.contains('open'))el.querySelector('button')?.focus()}
function toggleVideo(){const v=[...slides[index].querySelectorAll('video')];if(!v.length)return;const play=v.some(x=>x.paused);v.forEach(x=>play?x.play().catch(()=>{}):x.pause())}
function flashControls(){document.body.classList.add('controls');clearTimeout(controlsTimer);controlsTimer=setTimeout(()=>document.body.classList.remove('controls'),2200)}
document.getElementById('overview-grid').innerHTML=slides.map((s,i)=>`<button class="overview-item" data-index="${i}"><span class="ovnum">${i<mainCount?String(i+1).padStart(2,'0'):'B'+(i-mainCount+1)}</span><span class="ovtitle">${esc(s.dataset.title)}</span><span class="ovsection">${esc(s.dataset.section)}</span></button>`).join('');
document.querySelectorAll('.overview-item').forEach(b=>b.addEventListener('click',()=>{show(+b.dataset.index);document.getElementById('overview').classList.remove('open')}));
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>action(b.dataset.action)));
function action(a){if(a==='review')window.RECOVA_REVIEW?.toggle();if(a==='next')next();if(a==='prev')previous();if(a==='notes')toggleNotes();if(a==='overview')toggleOverlay('overview');if(a==='help')toggleOverlay('help');if(a==='video')toggleVideo();if(a==='fullscreen'){if(!document.fullscreenElement)document.documentElement.requestFullscreen?.().catch(()=>{});else document.exitFullscreen?.()}if(a==='presenter')openPresentationWindow();if(a==='reset')started=Date.now();}
document.getElementById('notes-body').addEventListener('click',e=>{
 const cue=e.target.closest('[data-script-step]');if(cue){setStep(Number(cue.dataset.scriptStep));return}
 const control=e.target.closest('[data-cue-action]');if(control){if(control.dataset.cueAction==='next')next();else setStep(step-1)}
});
stage.addEventListener('click',e=>{if(scriptSteps().length&&!e.defaultPrevented&&!e.target.closest('a,button,video,input,textarea,select,canvas,.native-pipeline,.rl16-stage'))next()});
document.addEventListener('keydown',e=>{if(e.defaultPrevented||e.target.isContentEditable||/INPUT|TEXTAREA|SELECT|CANVAS/.test(e.target.tagName)||e.target.closest('#review-panel'))return;if(/^(BUTTON|SUMMARY)$/.test(e.target.tagName)&&[' ','Enter'].includes(e.key))return;if(e.key==='Escape'){document.querySelectorAll('.open').forEach(x=>x.classList.remove('open'));document.body.classList.remove('blackout');return}if(document.querySelector('#overview.open,#help.open'))return;
 const k=e.key.toLowerCase();if(['arrowright','arrowdown','pagedown',' ','enter','arrowleft','arrowup','pageup','home','end'].includes(k))e.preventDefault();
 if(['arrowright','arrowdown','pagedown',' ','enter'].includes(k)){if(e.shiftKey)show(index+1);else next()}if(['arrowleft','arrowup','pageup'].includes(k)){if(e.shiftKey)show(index-1);else previous()}if(k==='home')show(0,true,0);if(k==='end')show(mainCount-1);if(k==='r')window.RECOVA_REVIEW?.toggle();if(k==='n')toggleNotes();if(k==='o')toggleOverlay('overview');if(k==='?')toggleOverlay('help');if(k==='f')action('fullscreen');if(k==='p')action('presenter');if(k==='v')toggleVideo();if(k==='b')document.body.classList.toggle('blackout');if(k==='a'){autoplay=!autoplay;document.getElementById('autoplay-status').textContent=autoplay?'Autoplay on':'Autoplay off';if(autoplay)slides[index].querySelectorAll('video').forEach(v=>v.play().catch(()=>{}));flashControls();}});
document.querySelectorAll('video').forEach(v=>{const wrap=v.closest('.media'),button=wrap.querySelector('button');v.addEventListener('click',()=>v.paused?v.play().catch(()=>{}):v.pause());button?.addEventListener('click',()=>v.paused?v.play().catch(()=>{}):v.pause());v.addEventListener('play',()=>{wrap.classList.add('playing');if(button)button.textContent='Pause'});v.addEventListener('pause',()=>{wrap.classList.remove('playing');if(button)button.textContent='Play clip'});v.addEventListener('error',()=>{if(!wrap.querySelector('.video-error')){const err=document.createElement('div');err.className='video-error';err.textContent='Video unavailable. The still frame remains available.';wrap.append(err)}})});
let touchX=null;document.addEventListener('touchstart',e=>{if(e.target.closest('video,button,canvas,.live-twin,#notes,#review-panel'))return;touchX=e.changedTouches[0].screenX},{passive:true});document.addEventListener('touchend',e=>{if(touchX===null)return;const d=e.changedTouches[0].screenX-touchX;if(Math.abs(d)>70){if(d<0)next();else previous()}touchX=null},{passive:true});
if(channel)channel.onmessage=e=>{const data=e.data;if(!data||!Number.isInteger(data.index)||data.index<0||data.index>=slides.length)return;if(data.type==='step'&&data.index===index)setStep(data.step,false);else if(data.type==='slide'||data.type==='step')show(data.index,false,data.step||0)};
addEventListener('hashchange',()=>show((parseInt(location.hash.slice(1),10)||1)-1,true,0));addEventListener('resize',resize);addEventListener('mousemove',flashControls);
setInterval(()=>{const sec=Math.floor((Date.now()-started)/1000);document.getElementById('clock').textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`},1000);
if(isPresenterWindow)document.body.classList.add('presenter');
document.querySelectorAll('[data-action="presenter"]').forEach(button=>{button.textContent=isPresenterWindow?'Audience window':'Presenter window';button.title=isPresenterWindow?'Open or focus the clean audience window (P)':'Open synchronized notes in another window (P)';button.setAttribute('aria-label',button.title)});
if(new URLSearchParams(location.search).has('all'))document.body.classList.add('print-all');
if(new URLSearchParams(location.search).has('preview'))document.body.classList.add('preview-mode');
let suspendedVideos=[];
document.addEventListener('visibilitychange',()=>{if(document.hidden){suspendedVideos=[...document.querySelectorAll('video')].filter(v=>!v.paused);suspendedVideos.forEach(v=>v.pause())}else{suspendedVideos.filter(v=>v.closest('.slide.active')).forEach(v=>v.play().catch(()=>{}));suspendedVideos=[]}});
document.getElementById('autoplay-status').textContent=autoplay?'Autoplay on':'Autoplay off';
window.DECK={show,slides,mainCount,resize,next,previous,setStep,state};resize();show((parseInt(location.hash.slice(1),10)||1)-1,true,new URLSearchParams(location.search).get('step')||0);flashControls();
