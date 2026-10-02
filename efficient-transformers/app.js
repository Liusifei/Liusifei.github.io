(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const grid = $('#scan-grid');
  const size = 11;
  const scan = { direction: 'lr', row: 5, column: 5, step: size - 1, running: false, timer: null };
  const pixels = [];
  const directions = {
    lr: ['Columns advance →', 'One directional receptive field', 'A local step opens a wider view.', 'Each new column reads the three neighboring states in the preceding column. Repeated updates spread information through a growing cone.'],
    rl: ['← Columns advance', 'Right-to-left propagation', 'Bring context from the other side.', 'Reverse the scan direction: each state now gathers from the next column. Its dependencies form a cone opening to the right.'],
    tb: ['Rows advance ↓', 'Top-to-bottom propagation', 'The same update, rotated.', 'Process every position in a row together, then advance downward. Three neighbors in the preceding row carry the context.'],
    bt: ['↑ Rows advance', 'Bottom-to-top propagation', 'Complete the vertical context.', 'Advance upward from the bottom edge. The selected output can collect information from the rows below it.'],
    all: ['Four directions · complementary context', 'The union of four directional scans', 'Together, the cones cover the image.', 'Every other pixel can reach the selected output through at least one directional scan. Long-range context emerges from repeated local transitions.']
  };
  function contributes(r, c, direction) {
    const dr = r - scan.row, dc = c - scan.column;
    if (!dr && !dc) return false;
    return direction === 'lr' ? dc < 0 && -dc >= Math.abs(dr)
      : direction === 'rl' ? dc > 0 && dc >= Math.abs(dr)
      : direction === 'tb' ? dr < 0 && -dr >= Math.abs(dc)
      : direction === 'bt' ? dr > 0 && dr >= Math.abs(dc)
      : ['lr', 'rl', 'tb', 'bt'].some(d => contributes(r, c, d));
  }
  function phase(r, c, direction) {
    return direction === 'lr' ? c : direction === 'rl' ? size - 1 - c : direction === 'tb' ? r : size - 1 - r;
  }
  function renderScan() {
    let count = 0;
    for (const { element, r, c } of pixels) {
      const candidate = contributes(r, c, scan.direction);
      if (candidate) count++;
      const phases = scan.direction === 'all' ? ['lr','rl','tb','bt'].map(d => phase(r,c,d)) : [phase(r,c,scan.direction)];
      const visited = phases.some(value => value <= scan.step);
      const current = scan.running && phases.some(value => value === scan.step);
      element.classList.toggle('contributor', candidate && visited);
      element.classList.toggle('future', !visited);
      element.classList.toggle('wavefront', current);
      const selected = r === scan.row && c === scan.column;
      element.classList.toggle('query', selected);
      element.setAttribute('aria-pressed', String(selected));
      element.title = `Row ${r + 1}, column ${c + 1}${selected ? ' · selected output' : candidate ? ' · contributing input' : ''}`;
    }
    const [axis, heading, title, copy] = directions[scan.direction];
    $('#scan-axis').textContent = axis;
    $('#scan-heading').textContent = heading;
    $('#scan-title').textContent = title;
    $('#scan-copy').textContent = copy;
    $('#scan-count').textContent = count;
    $('#scan-count-label').textContent = scan.direction === 'all' ? 'other pixels can reach the selected output' : 'earlier pixels can reach the selected output';
    $('#scan-status').textContent = scan.running ? `Step ${scan.step + 1} / ${size} · an entire line updates together` : `${size} × ${size} illustrative grid · full scan shown`;
  }
  function stopScan() {
    clearInterval(scan.timer);
    scan.timer = null;
    scan.running = false;
    scan.step = size - 1;
    $('#scan-play').textContent = '▶ Run scan';
    renderScan();
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const element = document.createElement('button');
      element.type = 'button';
      element.className = 'pixel';
      element.setAttribute('aria-label', `Select output at row ${r + 1}, column ${c + 1}`);
      element.addEventListener('click', () => { scan.row = r; scan.column = c; renderScan(); });
      element.addEventListener('keydown', event => {
        const shifts = { ArrowLeft: [0,-1], ArrowRight: [0,1], ArrowUp: [-1,0], ArrowDown: [1,0] };
        const delta = shifts[event.key];
        if (!delta) return;
        event.preventDefault();
        const nr = Math.max(0,Math.min(size-1,r+delta[0]));
        const nc = Math.max(0,Math.min(size-1,c+delta[1]));
        pixels[nr*size+nc].element.focus();
      });
      grid.append(element);
      pixels.push({ element, r, c });
    }
  }
  $$('[data-direction]').forEach(button => button.addEventListener('click', () => {
    stopScan(); scan.direction = button.dataset.direction;
    $$('[data-direction]').forEach(item => item.setAttribute('aria-pressed',String(item===button)));
    renderScan();
  }));
  $('#scan-play').addEventListener('click', () => {
    if (scan.running) { stopScan(); return; }
    scan.running = true; scan.step = 0;
    $('#scan-play').textContent = '■ Stop scan'; renderScan();
    scan.timer = setInterval(() => {
      scan.step++;
      if (scan.step >= size) stopScan(); else renderScan();
    }, 390);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && scan.running) stopScan(); });
  renderScan();

  const shifts = {
    top: { values:[0,10,20,30], name:'Aligned upper-left', caption:'Shift values down one row; a zero fills the missing top neighbor.' },
    middle: { values:[10,20,30,40], name:'Aligned left', caption:'No shift: each row reads the same row of the preceding column.' },
    bottom: { values:[20,30,40,0], name:'Aligned lower-left', caption:'Shift values up one row; a zero fills the missing bottom neighbor.' }
  };
  function chooseShift(which) {
    const data = shifts[which];
    $('#shift-values').replaceChildren(...data.values.map(value => {
      const cell = document.createElement('b'); cell.textContent = value;
      if (!value) cell.className = 'zero'; return cell;
    }));
    $('#shift-name').textContent = data.name; $('#shift-caption').textContent = data.caption;
    $$('[data-shift]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.shift === which)));
    $$('[data-code-shift]').forEach(line => line.classList.toggle('highlight',line.dataset.codeShift === which));
  }
  $$('[data-shift]').forEach(button => button.addEventListener('click',() => chooseShift(button.dataset.shift)));
  chooseShift('top');

  const format = new Intl.NumberFormat('en-US');
  function updateResolution() {
    const side = Number($('#resolution').value), pixels = side*side;
    $('#pixel-count').textContent = format.format(pixels);
    $('#depth-count').textContent = format.format(side);
    $('#parallel-count').textContent = format.format(side);
    $('#raster-label').textContent = `${format.format(pixels)} dependent positions`;
    $('#line-label').textContent = `${format.format(side)} dependent columns`;
  }
  $('#resolution').addEventListener('change',updateResolution); updateResolution();

  function updateMemory(mode) {
    const addresses = Array.from({length:8},(_,i) => mode === 'strided' ? i*8 : i);
    $('#thread-line').replaceChildren(...addresses.map((address,index) => {
      const thread=document.createElement('div'); thread.append(document.createTextNode(`T${index}`));
      const value=document.createElement('b'); value.textContent=`[${address}]`; thread.append(value); return thread;
    }));
    $('#memory-addresses').replaceChildren(...Array.from({length:4},(_,group) => {
      const item=document.createElement('div'); item.className='address-group';
      item.classList.toggle('touched',addresses.some(address => Math.floor(address/16)===group));
      const label=document.createElement('span'); label.textContent=`Addresses ${group*16}–${group*16+15}`;
      const cells=document.createElement('div'); cells.className='address-cells';
      for(let i=0;i<16;i++) { const cell=document.createElement('i');cell.className=addresses.includes(group*16+i)?'selected':'';cell.title=`Address ${group*16+i}`;cells.append(cell); }
      item.append(label,cells);return item;
    }));
    $$('[data-memory]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.memory===mode)));
    $('#memory-result').textContent = mode==='strided' ? 'Requests are spread across the address space.' : 'Neighboring requests fall next to each other.';
    $('#memory-copy').textContent = mode==='strided' ? 'In the original NCHW mapping, neighboring work items often access strided values. The hardware must gather data from separated regions.' : 'Reorganizing access lets the GPU serve neighboring threads from contiguous memory regions. More of the data transferred is useful to the current work.';
  }
  $$('[data-memory]').forEach(button=>button.addEventListener('click',()=>updateMemory(button.dataset.memory)));
  updateMemory('strided');

  const timings = [
    ['ORIGINAL SCAN','One launch per sequential column, with strided memory accesses and intermediate states exchanged through global memory.'],
    ['FUSED SCAN','Move the sequential loop inside its scan kernel. Fewer launches help, but fusion alone leaves the larger memory-access cost unresolved.'],
    ['COALESCED MEMORY','Arrange the computation so neighboring threads access neighboring addresses. This is the dominant gain in this reported configuration.'],
    ['FULL OPTIMIZED DESIGN','Combine memory improvements, selective state reuse, thread layout and channel compression. The final point includes both kernel engineering and model parameterization changes.']
  ];
  $$('[data-timing]').forEach(button=>button.addEventListener('click',()=>{
    const [label,copy]=timings[Number(button.dataset.timing)];
    $('#timing-label').textContent=label;$('#timing-copy').textContent=copy;
    $$('[data-timing]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  }));
  const navLinks=$$('.topbar nav a');
  if ('IntersectionObserver' in window) {
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries) if(entry.isIntersecting) navLinks.forEach(link=>link.classList.toggle('active',link.hash===`#${entry.target.id}`));
    },{rootMargin:'-15% 0px -65% 0px'});
    $$('.chapter').forEach(section=>observer.observe(section));
    const scanObserver=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting&&scan.running)stopScan();});
    scanObserver.observe(grid);
  }
  function updateProgress(){const max=document.documentElement.scrollHeight-innerHeight;$('#reading-progress').style.width=`${max>0?Math.min(100,scrollY/max*100):0}%`;}
  addEventListener('scroll',updateProgress,{passive:true}); addEventListener('resize',updateProgress);updateProgress();
})();
