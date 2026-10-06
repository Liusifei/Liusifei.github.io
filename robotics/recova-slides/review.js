/* Per-slide feedback stays attached to stable slide IDs, including after reordering. */
'use strict';
(() => {
  if (!window.DECK) return;
  const KEY = 'recova-review-v1';
  const API = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) && /^\/(?:index\.html)?$/.test(location.pathname) ? '/api/review' : null;
  const MAX_TEXT = 20000;
  const deckSlides = window.DECK.slides;
  const revision = document.querySelector('meta[name="deck-revision"]')?.content || 'unversioned';
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let cache;
  try { cache = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { cache = {}; }
  let events = Array.isArray(cache.events) ? cache.events : [];
  let pending = Array.isArray(cache.pending) ? cache.pending : [];
  let drafts = cache.drafts && typeof cache.drafts === 'object' ? cache.drafts : {};
  let activeID = null, debounce, syncing = false, connected = false, localOK = true, initialized = false;
  let lastError = '', feedbackList = false;
  const panel = document.createElement('aside');
  panel.id = 'review-panel';
  panel.setAttribute('aria-label', 'Slide review');
  panel.innerHTML = `
    <header class="review-header"><div><span class="review-eyebrow">Recova</span><h1>Slide review</h1></div><button class="review-icon" id="review-close" aria-label="Close review mode" title="Close review mode (R)">×</button></header>
    <div class="review-scroll">
      <nav class="review-navigation" aria-label="Review slide navigation"><button id="review-prev" aria-label="Review previous slide">←</button><select id="review-jump" aria-label="Choose a slide to review"></select><button id="review-next" aria-label="Review next slide">→</button></nav>
      <div class="review-slide-heading"><p class="review-section" id="review-section"></p><h2 id="review-title"></h2><p class="review-revision" id="review-revision"></p></div>
      <form id="review-form"><label for="review-advice">Advice for this slide</label><textarea id="review-advice" maxlength="${MAX_TEXT}" rows="6" placeholder="What should change? Describe the content, wording, layout, or an illustration."></textarea><div class="review-save-row"><span id="review-save-status" role="status" aria-live="polite">Connecting…</span><button class="review-primary" id="review-submit" type="submit">Add advice</button></div></form>
      <p class="review-instruction">Then tell me <strong>“apply my feedback”</strong> in chat. Your advice stays with this slide across revisions.</p>
      <section class="review-history-section" aria-labelledby="review-history-title"><div class="review-section-heading"><h3 id="review-history-title">Advice history</h3><span id="review-open-count"></span></div><div id="review-history"></div></section>
      <section class="review-all-section"><button id="review-list-toggle" class="review-text-button" aria-expanded="false">All feedback <span id="review-total"></span><span aria-hidden="true">↗</span></button><div id="review-all-list" hidden></div></section>
    </div>
    <footer class="review-footer"><button id="review-export">Export feedback</button><button id="review-retry">Sync now</button><span>R · review mode</span></footer>`;
  document.body.append(panel);
  const el = id => document.getElementById(id);
  if (!API) {
    el('review-retry').hidden = true;
    panel.querySelector('.review-instruction').textContent = 'Feedback is saved in this browser. Export feedback to share your notes when requesting changes.';
  }
  const input = el('review-advice');
  const toolbarButton = document.createElement('button');
  toolbarButton.type = 'button';
  toolbarButton.id = 'review-toggle';
  toolbarButton.textContent = 'Review';
  toolbarButton.title = 'Review this slide (R)';
  toolbarButton.setAttribute('aria-controls', 'review-panel');
  toolbarButton.setAttribute('aria-expanded', 'false');
  document.getElementById('toolbar')?.insertBefore(toolbarButton, document.querySelector('#toolbar [data-action="notes"]'));
  const helpList = document.querySelector('#help dl');
  if (helpList) helpList.insertAdjacentHTML('beforeend', '<dt>R</dt><dd>Review the current slide and save feedback</dd>');

  function activeSlide() { return deckSlides.find(s => s.classList.contains('active')) || deckSlides[0]; }
  function slideNumber(slide) {
    const at = deckSlides.indexOf(slide);
    return at < window.DECK.mainCount ? String(at + 1).padStart(2, '0') : 'B' + (at - window.DECK.mainCount + 1);
  }
  function uniqueID() { return crypto.randomUUID?.() || `review-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify({events, pending, drafts})); localOK = true; }
    catch { localOK = false; }
  }
  function info(slideID) {
    const slide = deckSlides.find(s => s.dataset.slideId === slideID);
    return {slide_id: slideID, title: slide?.dataset.title || slideID, revision, ...(slide?.dataset.slideRevision ? {slide_revision: slide.dataset.slideRevision} : {})};
  }
  function currentDraft(slideID) {
    if (drafts[slideID]) return drafts[slideID];
    const latest = events.filter(e => e.slide_id === slideID && e.type === 'draft').at(-1);
    return latest ? {text: latest.text, revision: latest.revision, slide_revision: latest.slide_revision, title: latest.title, dirty: false} : {text: '', revision, dirty: false};
  }
  function comments(slideID) {
    const result = events.filter(e => e.type === 'comment' && e.slide_id === slideID).map(e => ({...e, status: e.status === 'addressed' ? 'addressed' : 'open'}));
    for (const event of events) {
      if (event.type !== 'status' || event.slide_id !== slideID) continue;
      const target = result.find(item => item.id === event.target_id);
      if (target) { target.status = event.status; target.status_revision = event.revision; if (event.response) target.response = event.response; }
    }
    return result;
  }
  function enqueue(payload) {
    const event = {id: uniqueID(), ...payload, ...(payload.type === 'comment' ? {status: 'open'} : {}), created_at: new Date().toISOString()};
    events.push(event);
    pending.push(event.id);
    persist();
    updateStatus();
    if (initialized) sync();
    return event;
  }
  function flushDraft(slideID = activeID) {
    clearTimeout(debounce);
    const draft = drafts[slideID];
    if (!draft?.dirty) return;
    draft.dirty = false;
    enqueue({...info(slideID), ...draft, type: 'draft', text: draft.text, dirty: undefined});
    persist();
  }
  function updateStatus() {
    const dirty = Object.values(drafts).some(draft => draft.dirty);
    const status = el('review-save-status');
    status.className = '';
    if (!localOK && !connected) { status.textContent = 'Not saved · keep this tab open'; status.className = 'review-save-warning'; }
    else if (!API) status.textContent = dirty ? 'Saving…' : 'Saved in this browser';
    else if (syncing || dirty) status.textContent = 'Saving…';
    else if (pending.length) { status.textContent = 'Saved in this browser · sync pending'; status.className = 'review-save-warning'; }
    else if (connected) status.textContent = currentDraft(activeID).text ? 'Draft saved to project' : 'Saved to project';
    else { status.textContent = initialized ? 'Browser backup · server unavailable' : 'Connecting…'; status.className = 'review-save-warning'; }
    status.title = !API ? 'Export feedback to share these browser-local notes.' : lastError || (pending.length ? 'Your browser keeps a backup until the local server is available.' : 'Project feedback: review/feedback.json');
    el('review-submit').disabled = !input.value.trim();
  }
  async function loadRemote() {
    const response = await fetch(API, {cache: 'no-store'});
    if (!response.ok) throw new Error(`Review server: ${response.status}`);
    const data = await response.json();
    if (data.schema_version !== 1 || !Array.isArray(data.events)) throw new Error('Unrecognized feedback format');
    const remoteIDs = new Set(data.events.map(e => e.id));
    const localPending = events.filter(e => pending.includes(e.id) && !remoteIDs.has(e.id));
    events = [...data.events, ...localPending];
    pending = pending.filter(id => !remoteIDs.has(id));
    // Dirty drafts belong to the user's current editing session. A network response must never replace them.
    for (const slide of deckSlides) {
      const id = slide.dataset.slideId;
      if (drafts[id]?.dirty || pending.some(eventID => events.find(e => e.id === eventID)?.slide_id === id && events.find(e => e.id === eventID)?.type === 'draft')) continue;
      const latest = events.filter(e => e.slide_id === id && e.type === 'draft').at(-1);
      if (latest) drafts[id] = {text: latest.text, revision: latest.revision, slide_revision: latest.slide_revision, title: latest.title, dirty: false};
    }
    connected = true;
    lastError = '';
    persist();
  }
  async function sync(refresh = false) {
    if (!API) { updateStatus(); return; }
    if (syncing || !initialized) return;
    syncing = true;
    updateStatus();
    try {
      if (!connected || refresh) await loadRemote();
      while (pending.length) {
        const id = pending[0];
        const event = events.find(e => e.id === id);
        if (!event) { pending.shift(); continue; }
        const {created_at, dirty, ...payload} = event;
        const response = await fetch(API, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({event: payload})});
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `Review server: ${response.status}`);
        const position = events.findIndex(e => e.id === id);
        if (position !== -1) events[position] = result.event;
        pending = pending.filter(value => value !== id);
        persist();
      }
      connected = true;
      lastError = '';
    } catch (error) { connected = false; lastError = error.message; }
    finally { syncing = false; updateStatus(); renderHistory(); renderList(); }
  }
  function renderHistory() {
    const items = comments(activeID);
    const count = items.filter(item => item.status === 'open').length;
    el('review-open-count').textContent = count ? `${count} open` : '';
    el('review-history').innerHTML = items.length ? items.slice().reverse().map(item => {
      const isOld = item.slide_revision ? item.slide_revision !== activeSlide().dataset.slideRevision : item.revision !== revision;
      const timestamp = item.created_at ? new Date(item.created_at).toLocaleString(undefined, {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : '';
      return `<article class="review-comment ${item.status === 'addressed' ? 'is-addressed' : ''}"><div class="review-comment-meta"><span class="review-badge">${escapeHTML(item.status === 'addressed' ? 'Addressed' : 'Open')}</span><time>${escapeHTML(timestamp)}</time></div><p>${escapeHTML(item.text)}</p>${item.response ? `<div class="review-response"><strong>Revision note</strong><p>${escapeHTML(item.response)}</p></div>` : ''}<div class="review-comment-bottom"><span title="Deck revision ${escapeHTML(item.revision)}">${isOld ? 'Earlier slide revision' : 'Current slide revision'}</span><button data-status-id="${escapeHTML(item.id)}" data-next-status="${item.status === 'addressed' ? 'open' : 'addressed'}">${item.status === 'addressed' ? 'Reopen' : 'Mark addressed'}</button></div></article>`;
    }).join('') : '<p class="review-empty">Your saved advice will appear here.</p>';
  }
  function renderList() {
    let total = 0;
    const entries = deckSlides.map((slide, position) => {
      const items = comments(slide.dataset.slideId);
      const draft = currentDraft(slide.dataset.slideId).text.trim();
      const open = items.filter(item => item.status === 'open').length;
      total += open + (draft ? 1 : 0);
      return {slide, position, count: items.length, open, draft};
    });
    const currentIDs = new Set(deckSlides.map(slide => slide.dataset.slideId));
    const archivedIDs = [...new Set(events.filter(event => event.type === 'comment' && !currentIDs.has(event.slide_id)).map(event => event.slide_id))];
    const archived = archivedIDs.map(id => {
      const items = comments(id);
      total += items.filter(item => item.status === 'open').length;
      return {title: items.at(-1)?.title || id, items};
    });
    el('review-total').textContent = total ? `(${total} open)` : '';
    toolbarButton.textContent = total ? `Review · ${total}` : 'Review';
    el('review-jump').innerHTML = entries.map(({slide, position, open, draft}) => `<option value="${position}" ${slide.dataset.slideId === activeID ? 'selected' : ''}>${slideNumber(slide)} / ${escapeHTML(slide.dataset.title)}${open || draft ? ' •' : ''}</option>`).join('');
    const currentHTML = entries.filter(item => item.count || item.draft).map(({slide, position, open, draft}) => `<button class="review-list-item" data-slide-index="${position}"><span>${slideNumber(slide)}</span><span>${escapeHTML(slide.dataset.title)}<small>${open ? `${open} open` : draft ? 'Draft' : 'Addressed'}${draft && open ? ' · draft' : ''}</small></span><span>→</span></button>`).join('');
    const archivedHTML = archived.length ? `<section aria-label="Archived slide feedback"><div class="review-section-heading"><h3>Archived slides</h3></div><p class="review-empty">Advice on slides removed from this deck.</p>${archived.map(({title, items}) => `<details><summary>${escapeHTML(title)}</summary>${items.slice().reverse().map(item => `<article class="review-comment ${item.status === 'addressed' ? 'is-addressed' : ''}"><div class="review-comment-meta"><span class="review-badge">${item.status === 'addressed' ? 'Addressed' : 'Open'}</span><span>Archived slide</span></div><p>${escapeHTML(item.text)}</p>${item.response ? `<div class="review-response"><strong>Revision note</strong><p>${escapeHTML(item.response)}</p></div>` : ''}</article>`).join('')}</details>`).join('')}</section>` : '';
    el('review-all-list').innerHTML = currentHTML + archivedHTML || '<p class="review-empty">Add advice to any slide to build your review list.</p>';
  }
  function renderSlide() {
    const slide = activeSlide();
    if (activeID && activeID !== slide.dataset.slideId) flushDraft(activeID);
    activeID = slide.dataset.slideId;
    el('review-title').textContent = slide.dataset.title;
    el('review-section').textContent = `${slideNumber(slide)} / ${slide.dataset.section}`;
    el('review-revision').textContent = `Deck revision ${revision.slice(0, 10)}`;
    input.value = currentDraft(activeID).text;
    el('review-prev').disabled = deckSlides.indexOf(slide) === 0;
    el('review-next').disabled = deckSlides.indexOf(slide) === deckSlides.length - 1;
    renderHistory(); renderList(); updateStatus();
  }
  function toggle(force) {
    const open = typeof force === 'boolean' ? force : !document.body.classList.contains('review-mode');
    flushDraft();
    document.body.classList.toggle('review-mode', open);
    if (open) document.body.classList.remove('presenter');
    panel.inert = !open;
    panel.setAttribute('aria-hidden', String(!open));
    toolbarButton.setAttribute('aria-expanded', String(open));
    const url = new URL(location.href);
    if (open) url.searchParams.set('review', '1'); else url.searchParams.delete('review');
    history.replaceState(null, '', url);
    window.DECK.resize();
    if (open) { renderSlide(); sync(true); } else toolbarButton.focus();
  }
  function submitAdvice(event) {
    event?.preventDefault();
    if (!input.value.trim()) return;
    clearTimeout(debounce);
    const text = input.value.trim();
    const original = currentDraft(activeID);
    enqueue({...info(activeID), revision: original.revision || revision, ...(original.slide_revision ? {slide_revision: original.slide_revision} : {}), ...(original.title ? {title: original.title} : {}), type: 'comment', text});
    drafts[activeID] = {text: '', revision, dirty: true};
    input.value = '';
    flushDraft();
    renderHistory(); renderList(); updateStatus();
  }
  input.addEventListener('input', () => {
    drafts[activeID] = {...info(activeID), text: input.value.slice(0, MAX_TEXT), dirty: true};
    persist(); updateStatus();
    clearTimeout(debounce);
    debounce = setTimeout(() => { flushDraft(); renderList(); }, 650);
  });
  panel.addEventListener('keydown', event => {
    if (event.isComposing) return;
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); submitAdvice(); }
    if (event.key === 'Escape' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) { event.preventDefault(); toggle(false); }
  });
  el('review-form').addEventListener('submit', submitAdvice);
  el('review-close').addEventListener('click', () => toggle(false));
  toolbarButton.addEventListener('click', () => toggle());
  el('review-prev').addEventListener('click', () => window.DECK.show(deckSlides.indexOf(activeSlide()) - 1));
  el('review-next').addEventListener('click', () => window.DECK.show(deckSlides.indexOf(activeSlide()) + 1));
  el('review-jump').addEventListener('change', event => window.DECK.show(Number(event.target.value)));
  el('review-history').addEventListener('click', event => {
    const button = event.target.closest('[data-status-id]');
    if (!button) return;
    enqueue({...info(activeID), type: 'status', target_id: button.dataset.statusId, status: button.dataset.nextStatus});
    renderHistory(); renderList();
  });
  el('review-list-toggle').addEventListener('click', () => {
    feedbackList = !feedbackList;
    el('review-all-list').hidden = !feedbackList;
    el('review-list-toggle').setAttribute('aria-expanded', String(feedbackList));
  });
  el('review-all-list').addEventListener('click', event => {
    const button = event.target.closest('[data-slide-index]');
    if (button) window.DECK.show(Number(button.dataset.slideIndex));
  });
  el('review-retry').addEventListener('click', () => { flushDraft(); sync(true); });
  el('review-export').addEventListener('click', () => {
    flushDraft();
    const blob = new Blob([JSON.stringify({schema_version: 1, deck_revision: revision, exported_at: new Date().toISOString(), events, pending_event_ids: pending}, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `recova-feedback-${new Date().toISOString().slice(0, 10)}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  window.addEventListener('deckchange', renderSlide);
  window.addEventListener('online', () => sync(true));
  window.addEventListener('pagehide', () => { flushDraft(); persist(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { flushDraft(); persist(); } else if (document.body.classList.contains('review-mode')) sync(true); });
  setInterval(() => { if (pending.length && !document.hidden) sync(); }, 8000);
  window.RECOVA_REVIEW = {toggle, sync: () => { flushDraft(); return sync(true); }};
  renderSlide();
  panel.inert = true;
  panel.setAttribute('aria-hidden', 'true');
  initialized = true;
  for (const id of Object.keys(drafts)) if (drafts[id].dirty) flushDraft(id);
  sync(true).then(() => { if (document.activeElement !== input && !drafts[activeID]?.dirty) input.value = currentDraft(activeID).text; updateStatus(); });
  if (new URLSearchParams(location.search).has('review')) toggle(true);
})();
