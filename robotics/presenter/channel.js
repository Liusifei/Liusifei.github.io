/* One session per audience window. BroadcastChannel is backed by storage events. */
window.TalkChannel = function (deck, session, receive) {
  const key = `talk-presenter:${deck}:${session}`;
  const sender = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  const seen = new Set();
  let channel;
  function accept(message) {
    if (!message || message.sender === sender || seen.has(message.id)) return;
    seen.add(message.id);
    if (seen.size > 200) seen.delete(seen.values().next().value);
    receive(message);
  }
  try { channel = new BroadcastChannel(key); channel.onmessage = e => accept(e.data); } catch {}
  const storageListener = e => {
    if (e.key !== key || !e.newValue) return;
    try { accept(JSON.parse(e.newValue)); } catch {}
  };
  addEventListener('storage', storageListener);
  return {
    send(type, payload = {}) {
      const message = {type, payload, sender, id: `${sender}:${Date.now()}:${Math.random()}`};
      channel?.postMessage(message);
      try { localStorage.setItem(key, JSON.stringify(message)); } catch {}
    },
    save(value) { try { localStorage.setItem(key + ':state', JSON.stringify(value)); } catch {} },
    read() { try { return JSON.parse(localStorage.getItem(key + ':state')); } catch { return null; } },
    close() { channel?.close(); removeEventListener('storage', storageListener); }
  };
};
