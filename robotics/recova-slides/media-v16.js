/* Adapted from the website collection.js: recorded route decisions, not a scripted demo. */
(() => {
  const root = document.querySelector('[data-collection-v16]');
  if (!root) return;
  const slide = root.closest('.slide');
  const video = root.querySelector('video');
  const flow = root.querySelector('.mv16-flow');
  const routes = [...root.querySelectorAll('.mv16-route')];
  const pins = [...root.querySelectorAll('.mv16-pin')];
  const selectedLabel = root.querySelector('.mv16-selected');
  const decisionLabel = root.querySelector('.mv16-decision');
  const event = root.querySelector('.mv16-event');
  const data = root.querySelector('.mv16-data');
  let manifest = null, selected = 0, lastKey = '', frame = 0;
  function stationDecisionAt(station, time) {
    let decision = station.decisions[0];
    for (const next of station.decisions) { if (next.time > time) break; decision = next; }
    return decision;
  }
  function paint() {
    if (!manifest) return;
    const time = video.currentTime * (manifest.mediaTimeScale || 1);
    const decisions = manifest.stations.map(station => stationDecisionAt(station, time));
    const key = `${selected}:${decisions.map(item => item.time).join(',')}`;
    if (key === lastKey) return;
    lastKey = key;
    const decision = decisions[selected];
    selectedLabel.textContent = selected + 1;
    decisionLabel.textContent = decision.message;
    event.dataset.route = decision.route;
    pins.forEach((pin, i) => pin.setAttribute('aria-pressed', String(i === selected)));
    routes.forEach(route => {
      let active = false;
      route.querySelectorAll('button').forEach((button, index) => {
        const match = decisions[index].route === route.dataset.route;
        button.hidden = !match;
        button.setAttribute('aria-pressed', String(index === selected));
        active ||= match;
      });
      route.classList.toggle('is-active', active);
    });
    data.classList.toggle('is-active', decisions.some(item => item.route === 'save'));
  }
  root.querySelectorAll('button[data-station]').forEach(button => button.addEventListener('click', e => {
    e.stopPropagation(); selected = Number(button.dataset.station) - 1; lastKey = ''; paint();
  }));
  // The source website's rounded connector layout, anchored to actual text/route boxes.
  function draw() {
    const box = flow.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const scale = 640 / box.width;
    const height = box.height * scale;
    const bounds = element => {
      const r = element.getBoundingClientRect();
      return {left:(r.left-box.left)*scale,right:(r.right-box.left)*scale,y:(r.top-box.top+r.height/2)*scale};
    };
    const from = bounds(root.querySelector('.mv16-agent strong'));
    const to = bounds(root.querySelector('.mv16-data strong'));
    const boxes = routes.map(bounds), left = Math.min(...boxes.map(b=>b.left)), right = Math.max(...boxes.map(b=>b.right));
    const start = from.right+5, end=to.left-5, bend1=(start+left)/2, bend2=(right+end)/2;
    const connector = (a,b,bend) => {
      if(Math.abs(b.y-a.y)<.5)return `M${a.x} ${a.y}H${b.x}`;
      const direction=Math.sign(b.y-a.y),r=Math.min(8,(bend-a.x)/2,(b.x-bend)/2,Math.abs(b.y-a.y)/2);
      return `M${a.x} ${a.y}H${bend-r}Q${bend} ${a.y} ${bend} ${a.y+direction*r}V${b.y-direction*r}Q${bend} ${b.y} ${bend+r} ${b.y}H${b.x}`;
    };
    const arrow=(x,y)=>`M${x-4} ${y-3}L${x} ${y}L${x-4} ${y+3}`;
    const svg=flow.querySelector('svg.mv16-connections');svg.setAttribute('viewBox',`0 0 640 ${height}`);
    svg.querySelector('[data-wire=delegate]').setAttribute('d',boxes.map(b=>connector({x:start,y:from.y},{x:b.left-3,y:b.y},bend1)+arrow(b.left-3,b.y)).join(' '));
    svg.querySelector('[data-wire=collect]').setAttribute('d',boxes.map(b=>connector({x:b.right+2,y:b.y},{x:end,y:to.y},bend2)).join(' ')+arrow(end,to.y));
  }
  function tick(){frame=0;if(!slide.classList.contains('active')||document.hidden)return;paint();if(!video.paused)frame=requestAnimationFrame(tick);}
  function begin(){paint();draw();if(!frame&&slide.classList.contains('active')&&!document.hidden)frame=requestAnimationFrame(tick);}
  video.addEventListener('play',begin);video.addEventListener('timeupdate',paint);video.addEventListener('seeked',paint);
  new MutationObserver(begin).observe(slide,{attributes:true,attributeFilter:['class']});
  new ResizeObserver(draw).observe(flow);
  document.fonts.ready.then(draw);
  document.addEventListener('visibilitychange',begin);
  fetch('assets/media/collection-v16-events.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json();}).then(m=>{manifest=m;begin();}).catch(()=>{decisionLabel.textContent='Recorded data collection across four workstations.';});
  draw();
})();
