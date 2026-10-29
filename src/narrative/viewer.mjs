import { NarrativeHost } from './host.mjs';
import { campaignCatalogURLs, loadCatalog } from './catalog.mjs';

const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// The viewer plays every manifest the campaign registers, so a new act's
// cinematics show up here without touching this module.
export function loadPreviewCatalog({ fetcher = globalThis.fetch } = {}) {
  return loadCatalog({ urls: campaignCatalogURLs(), fetcher: (url, options) => fetcher(url, { ...options, cache: 'no-store' }) });
}

export function openViewer(container) {
  container.innerHTML = `<section class="screen narrative-viewer"><div class="screen-heading"><h1>Narrative development viewer</h1><div class="actions"><button class="secondary" data-action="worlds">World backgrounds</button><button class="secondary" data-action="home">Back to game menu</button></div></div><p>Isolated samples — no story progress is saved. Enter: advance. Escape: skip.</p><label>Scene <select id="narrative-select" aria-label="Scene" disabled></select></label><div class="actions"><button class="primary" data-action="narrative-play" disabled>Play scene</button><button class="secondary" data-action="narrative-restart" disabled>Restart scene</button></div><p id="narrative-status" role="status">Loading catalog…</p><div class="narrative-viewer-stage"><div id="narrative-layer"></div></div></section>`;
  // Development edits must not reuse gameplay's in-memory catalog or old HTTP data.
  const host = new NarrativeHost({ load: loadPreviewCatalog }), select = container.querySelector('#narrative-select');
  let disposed = false, selected = null;
  host.attach(null, container.querySelector('#narrative-layer'), { preview: true }).then(() => {
    if (disposed) return;
    if (host.catalog) {
      select.innerHTML = host.catalog.entries.map(entry => `<option value="${escape(entry.id)}">${escape(entry.title)}${entry.error ? ' — INVALID' : ''}</option>`).join('');
      select.disabled = false;
      for (const button of container.querySelectorAll('[data-action="narrative-play"], [data-action="narrative-restart"]')) button.disabled = false;
    }
    status();
  });
  function status() {
    container.querySelector('#narrative-status').textContent = host.error ?? host.director?.error ??
      (host.director?.player ? `${host.director.player.scene.id}: ${host.director.player.status}` : 'Choose a sample scene.');
  }
  return {
    host,
    action(action) {
      if (action === 'narrative-play') { selected = select.value; host.preview(selected); }
      else if (action === 'narrative-restart') { if (selected) host.preview(selected); else { selected = select.value; host.preview(selected); } }
      else if (action === 'narrative-next') host.advance();
      else if (action === 'narrative-skip') host.skip();
      else return false;
      status(); return true;
    },
    tick(dt) { host.tick(dt); host.render(); status(); },
    dispose() { disposed = true; host.detach(); },
  };
}
