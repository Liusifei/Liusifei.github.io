(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const params = new URLSearchParams(location.search), deck=params.get('deck'), session=params.get('session');
  if (!['asena-talk','recova-talk'].includes(deck) || !/^[a-zA-Z0-9-]{8,80}$/.test(session||'')) {
    $('#connection').textContent='Open Presenter from an ASENA or Recova talk.';
    document.querySelectorAll('button,select').forEach(x=>x.disabled=true); return;
  }
  const deckUrl = new URL('../'+deck+'/',location.href);
  deckUrl.searchParams.set('presenterSession',session);
  $('#audience-link').href=deckUrl.href;
  $('#audience-link').target='talk-audience-'+session;
  $('#deck-name').textContent=(deck==='asena-talk'?'ASENA':'Recova')+' / Presenter';
  document.title=(deck==='asena-talk'?'ASENA':'Recova')+' — Presenter notes';
  if(deck==='recova-talk')document.documentElement.style.setProperty('--accent','#4c7038');
  const bus=TalkChannel(deck,session,receive), frames=[$('#current-preview iframe'),$('#next-preview iframe')];
  let state, notes=[], lastSeen=0, lastIndex=-1, notesSize=24, previewKeys=['',''];
  const format = ms => {const seconds=Math.max(0,Math.floor(ms/1000));return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;};
  const command=(action,extra={})=>bus.send('command',{action,...extra});
  function receive(message) {
    if(message.type!=='state'||message.payload?.deck!==deck)return;
    state=message.payload;lastSeen=Date.now();render();
  }
  function addText(parent,text) {
    String(text).split(/(\[[^\]]+\])/g).forEach(part=>{
      if(!part)return;
      if(part.startsWith('[')){const span=document.createElement('span');span.className='direction';span.textContent=part;parent.append(span);}
      else parent.append(document.createTextNode(part));
    });
  }
  function renderNotes() {
    if(!state)return;
    const item=notes[state.index];
    const text=Array.isArray(item?.script)?item.script.join('\n\n'):item?.script||item?.notes||'Loading speaking notes…';
    $('#notes').replaceChildren();
    String(text).split(/\n+/).forEach(line=>{const p=document.createElement('p');addText(p,line);$('#notes').append(p);});
    const cue=item?.stageDirection||item?.cue||'';
    $('#cue').textContent=cue;$('#cue').hidden=!cue;
    $('#notes').scrollTop=0;
  }
  function preview(which,index,step) {
    const key=`${index}:${step}`;
    if(previewKeys[which]===key)return;
    previewKeys[which]=key;
    frames[which].contentWindow?.postMessage({type:'talk-preview',index,step},location.origin);
  }
  function render() {
    if(!state)return;
    const {index,step,maxStep,slideCount,slides}=state;
    $('#position').textContent=`Slide ${index+1} of ${slideCount}`;
    $('#slide-title').textContent=state.title;
    $('#build').textContent=`Build ${step+1} / ${maxStep+1}`;
    $('#previous').disabled=index===0&&step===0;
    $('#next').disabled=index===slideCount-1&&step===maxStep;
    $('#next').textContent=step<maxStep?'Next build →':'Next slide →';
    $('#reveal').disabled=step===maxStep;
    $('#timer-toggle').textContent=state.timer.running?'Pause timer':'Start timer';
    $('#target').textContent='/ '+format(slides.reduce((n,s)=>n+s.seconds,0)*1000)+' target';
    $('#playback').hidden=deck!=='recova-talk';$('#playback').textContent=state.paused?'Play videos':'Pause videos';
    $('#audience-link').href=state.audienceUrl;
    if($('#slide-select').options.length!==slideCount){
      $('#slide-select').replaceChildren();
      slides.forEach((slide,i)=>{const option=new Option(`${i+1}. ${slide.title}`,i);$('#slide-select').append(option);});
    }
    $('#slide-select').value=index;
    preview(0,index,step);
    const next=Math.min(index+1,slideCount-1),atEnd=index===slideCount-1;
    $('#next-label').textContent=atEnd?'Closing slide':'Next slide';
    $('#next-number').textContent=atEnd?'':`${next+1} / ${slideCount}`;
    $('#next-title').textContent=slides[next].title;$('#end-note').hidden=!atEnd;
    preview(1,next,atEnd?slides[next].maxStep:0);
    if(lastIndex!==index){lastIndex=index;renderNotes();}
    updateClock();
  }
  function updateClock() {
    const live=lastSeen&&Date.now()-lastSeen<5000;
    $('#connection').textContent=live?'Connected · slide and build controls are synced':'Waiting for audience window — reopen it if closed';
    $('#connection').className='connection '+(live?'live':'disconnected');
    if(!state)return;
    const delta=state.timer.running?Math.max(0,Date.now()-state.timer.startedAt):0;
    $('#elapsed').textContent=format(state.timer.elapsedMs+delta);
    $('#slide-time').textContent=`This slide ${format(state.timer.slideMs+delta)} / ${format(state.slides[state.index].seconds*1000)} allocated`;
  }
  frames.forEach(frame=>{
    const url=new URL('../'+deck+'/',location.href);url.searchParams.set('presenterPreview','1');frame.src=url.href;
  });
  addEventListener('message',event=>{
    if(event.origin!==location.origin||event.data?.type!=='talk-preview-ready')return;
    const which=frames.findIndex(frame=>frame.contentWindow===event.source);
    if(which>=0){previewKeys[which]='';render();}
  });
  const resize=new ResizeObserver(entries=>entries.forEach(entry=>{entry.target.querySelector('iframe').style.transform=`scale(${entry.contentRect.width/1280})`;}));
  document.querySelectorAll('.preview').forEach(element=>resize.observe(element));
  $('#previous').onclick=()=>command('previous');$('#next').onclick=()=>command('next');
  $('#reveal').onclick=()=>state&&command('show',{index:state.index,step:state.maxStep});
  $('#slide-select').onchange=e=>command('show',{index:+e.target.value,step:0});
  $('#timer-toggle').onclick=()=>command('toggle-timer');$('#timer-reset').onclick=()=>command('reset-timer');
  $('#playback').onclick=()=>command('toggle-playback');
  $('#smaller').onclick=()=>{notesSize=Math.max(18,notesSize-2);document.documentElement.style.setProperty('--notes-size',notesSize+'px');};
  $('#larger').onclick=()=>{notesSize=Math.min(36,notesSize+2);document.documentElement.style.setProperty('--notes-size',notesSize+'px');};
  addEventListener('keydown',event=>{
    if(event.metaKey||event.ctrlKey||event.altKey||/INPUT|SELECT|TEXTAREA/.test(event.target.tagName))return;
    if(event.key===' '&&event.target.closest('button,a'))return;
    if(['ArrowRight','PageDown',' '].includes(event.key)){event.preventDefault();if(event.shiftKey&&state)command('show',{index:Math.min(state.index+1,state.slideCount-1),step:0});else command('next');}
    else if(['ArrowLeft','PageUp'].includes(event.key)){event.preventDefault();if(event.shiftKey&&state)command('show',{index:Math.max(state.index-1,0),step:0});else command('previous');}
    else if(event.key==='Home'){event.preventDefault();command('show',{index:0,step:0});}
    else if(event.key==='End'&&state){event.preventDefault();command('show',{index:state.slideCount-1,step:state.slides.at(-1).maxStep});}
    else if(event.key.toLowerCase()==='t')command('toggle-timer');
  });
  fetch('../'+deck+'/script.json?v=oral-notes-20261006', {cache:'no-cache'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{notes=Array.isArray(data)?data:data.slides||[];renderNotes();}).catch(()=>{$('#notes').textContent='The speaking script could not load. Reload this presenter window.';});
  const cached=bus.read();if(cached?.deck===deck){state=cached;render();}
  bus.send('hello');setInterval(()=>bus.send('hello'),2000);setInterval(updateClock,250);
})();
