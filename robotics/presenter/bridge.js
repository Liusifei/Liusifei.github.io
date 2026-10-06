(() => {
  'use strict';
  const deck = window.TALK_DECK;
  if (!deck) return;
  const params = new URLSearchParams(location.search);
  if (params.has('presenterPreview')) {
    document.body.classList.add('presenter-preview');
    deck.hideNotes(); deck.pause();
    // Embedded live viewers are replaced with small local stills, never another WebGL/video session.
    const embedded=document.querySelector(deck.key==='asena-talk'?'#recording':'.dashboard-frame iframe');
    if(embedded){
      const still=document.createElement('img');
      still.src='../presenter/'+(deck.key==='asena-talk'?'asena-recording.jpg':'recova-dashboard.jpg');
      still.alt=embedded.title+' — still preview';
      still.style.cssText='display:block;width:100%;object-fit:cover;height:'+(deck.key==='asena-talk'?'400px':'100%');
      embedded.replaceWith(still);
    }
    addEventListener('message', event => {
      if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'talk-preview') return;
      deck.show(event.data.index, event.data.step || 0); deck.pause();
    });
    parent.postMessage({type:'talk-preview-ready'}, location.origin);
    dispatchEvent(new Event('resize'));
    return;
  }
  document.body.classList.add('presenter-enabled');
  deck.hideNotes();
  const button = document.querySelector('#notes-button');
  button.textContent = 'Presenter';
  button.title = 'Open notes in a separate window (N). Fullscreen this audience window with F.';
  button.removeAttribute('aria-pressed');
  let bus, popup, session, revision = 0, lastIndex = deck.state().index;
  let timer = {running:false, elapsedMs:0, slideMs:0, startedAt:0};
  const loadChannel = new Promise(resolve => {
    if (window.TalkChannel) return resolve();
    const script = document.createElement('script');
    script.src = '../presenter/channel.js?v=1'; script.onload = resolve;
    document.head.append(script);
  });
  function settleTimer() {
    if (timer.running) {
      const delta = Math.max(0, Date.now() - timer.startedAt);
      timer.elapsedMs += delta; timer.slideMs += delta; timer.startedAt = Date.now();
    }
  }
  function snapshot() {
    const state = deck.state();
    if (state.index !== lastIndex) { settleTimer(); timer.slideMs = 0; lastIndex = state.index; }
    return {...state, deck:deck.key, name:deck.name, slides:deck.slides(), timer:{...timer},
      revision:++revision, sentAt:Date.now(), audienceUrl:location.href, hash:location.hash};
  }
  function publish() { if (bus) { const value=snapshot(); bus.save(value); bus.send('state',value); } }
  function receive(message) {
    if (message.type === 'hello') { publish(); return; }
    if (message.type !== 'command') return;
    const {action,index,step} = message.payload;
    if (action === 'next') deck.next();
    else if (action === 'previous') deck.previous();
    else if (action === 'show' && Number.isInteger(index) && Number.isInteger(step)) deck.show(index,step);
    else if (action === 'toggle-timer') { settleTimer(); timer.running=!timer.running; timer.startedAt=Date.now(); }
    else if (action === 'reset-timer') timer={running:false,elapsedMs:0,slideMs:0,startedAt:0};
    else if (action === 'toggle-playback') deck.togglePlayback?.();
    publish();
  }
  async function connect(id) {
    await loadChannel;
    if (bus) return;
    session=id; window.name='talk-audience-'+session;
    bus=TalkChannel(deck.key,session,receive);
    const saved=bus.read();
    if (saved?.timer && saved.hash === location.hash) timer=saved.timer;
    publish();
  }
  function blocked(url) {
    let dialog=document.querySelector('#presenter-help');
    if (!dialog) {
      dialog=document.createElement('dialog'); dialog.id='presenter-help'; dialog.className='presenter-help';
      dialog.innerHTML='<button aria-label="Close">×</button><h2>Open your presenter window</h2><p>Your browser blocked the new window. Use the link below, then move that tab to a separate window on your own screen.</p><a target="_blank" rel="noopener">Open presenter view ↗</a><small>Keep this slide window on the audience display. Press F here for full screen. Notes stay in the presenter window.</small>';
      dialog.querySelector('button').onclick=()=>dialog.close(); document.body.append(dialog);
    }
    dialog.querySelector('a').href=url;
    dialog.showModal();
  }
  function open() {
    deck.hideNotes();
    const valid=/^[a-zA-Z0-9-]{8,80}$/;
    const existing=new URLSearchParams(location.search).get('presenterSession');
    const id=session || (valid.test(existing||'') ? existing : crypto.randomUUID());
    const audience=new URL(location.href); audience.searchParams.set('presenterSession',id);
    history.replaceState(null,'',audience);
    const url=new URL('../presenter/',location.href); url.searchParams.set('deck',deck.key); url.searchParams.set('session',id);
    // Open synchronously in the click gesture; loading the channel must not trigger a popup block.
    popup=window.open(url.href,'talk-presenter-'+id,'popup,width=1400,height=900,resizable=yes,scrollbars=yes');
    connect(id);
    if (!popup) blocked(url.href); else popup.focus();
  }
  window.TALK_PRESENTER={open,publish};
  addEventListener('fullscreenchange',()=>dispatchEvent(new Event('resize')));
  ['asena-buildchange','asena-slidechange','recova-statechange'].forEach(type=>addEventListener(type,publish));
  setInterval(publish,1000);
  const existing=params.get('presenterSession');
  if (/^[a-zA-Z0-9-]{8,80}$/.test(existing||'')) connect(existing);
})();
