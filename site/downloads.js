/* The download buttons follow the GitHub releases by themselves, so nothing is changed here when a
   new version comes out:
   - "Nexmio Work" is the newest release that is not a pre-release (the highest version the owner made Nexmio Work).
   - "Nexmio Work Preview" is the newest release that has Preview files (every release has them).
   If GitHub cannot be reached, the buttons keep their links to the releases page. */
(function () {
  const REPO = 'nexmio/work.nexmio.com';
  const store = window.NEXMIO_STORE || {};
  const ver = r => r.tag_name.replace(/^v/, '').split('.').map(Number);
  const newest = (a, b) => { const x = ver(a), y = ver(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return y[i] - x[i]; return 0; };
  const pick = (assets, preview, test) => assets.find(a => (/preview/i.test(a.name) === preview) && test.test(a.name));
  const WIN = /-setup\.exe$/i, LINUX = /\.AppImage$/i;

  function fill(card, release, preview) {
    if (!card || !release) return;
    const assets = release.assets || [];
    const set = (key, asset) => {
      const a = card.querySelector('[data-dl="' + key + '"]');
      if (a && asset) a.href = asset.browser_download_url;
    };
    set('windows', pick(assets, preview, WIN));
    set('linux', pick(assets, preview, LINUX));
    card.querySelectorAll('[data-dl="version"]').forEach(el => { el.textContent = release.tag_name; });
  }

  function stores() {
    document.querySelectorAll('[data-edition]').forEach(card => {
      const url = store[card.dataset.edition];
      const a = card.querySelector('[data-dl="store"]');
      if (a && url) { a.href = url; a.hidden = false; }
    });
  }

  function hero(release) {
    if (!release) return;
    document.querySelectorAll('.hero [data-dl="version"]').forEach(el => { el.textContent = release.tag_name; });
  }

  stores();
  fetch('https://api.github.com/repos/' + REPO + '/releases?per_page=20', { headers: { Accept: 'application/vnd.github+json' } })
    .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then(list => {
      const published = list.filter(r => !r.draft).sort(newest);
      const stable = published.find(r => !r.prerelease);
      const preview = published.find(r => (r.assets || []).some(a => /preview/i.test(a.name)));
      const card = document.querySelector('[data-edition="stable"]');
      if (card && !stable) {
        card.querySelectorAll('.btns, .ticks').forEach(el => { el.hidden = true; });
        const soon = card.querySelector('.soon');
        if (soon) soon.hidden = false;
      }
      fill(card, stable, false);
      fill(document.querySelector('[data-edition="preview"]'), preview, true);
      hero(stable || preview);
    })
    .catch(() => { /* the buttons keep their links to the releases page */ });
})();
