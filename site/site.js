/* Nexmio PoC layout: shared navigation, background, footer, language and effects.
   Each page only contains its own content inside .wrap. Everything else comes from here,
   so all pages look the same. */

/* ---- products and their colours ---- */
const BR = {
  yellow: { name: 'Nexmio', tag: '',            page: 'index.html',  label: 'Nexmio',      host: 'nexmio.com' },
  purple: { name: 'Nexmio', tag: 'Work',        page: 'work.html',   label: 'Work',        host: 'work.nexmio.com' },
  green:  { name: 'Nexmio', tag: 'Family',      page: 'family.html', label: 'Family',      host: 'family.nexmio.com' },
  blue:   { name: 'Nexmio', tag: 'Placeholder', page: 'blue.html',   label: 'Placeholder', host: '' },
  red:    { name: 'Nexmio', tag: 'Placeholder', page: 'red.html',    label: 'Placeholder', host: '' },
};
const FOOTER_PRODUCTS = ['purple'];   // Family is added when it exists
const root = document.documentElement;
const me = root.dataset.brand;
const IMG = 'img/';

/* ---- language: the site is in English only ---- */
const T = (en) => en;   // the site is in English only
root.lang = 'en';

/* ---- light / dark ---- */
function getMode() {
  try { const m = localStorage.getItem('nx-mode'); if (m) return m; } catch (e) {}
  return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}
function applyMode(m) {
  root.dataset.mode = m;
  root.style.setProperty('--sitebg', `url(${IMG}site-bg-native-${m}-3840.webp)`);
  try { localStorage.setItem('nx-mode', m); } catch (e) {}
}
applyMode(getMode());

/* ---- logo: N as an image + "exmio" as text + coloured tag ---- */
const markSrc = b => b === 'yellow' ? `${IMG}mark-nexmio.png` : `${IMG}mark.png`;
const logoHTML = (b, tag) => `<img src="${markSrc(b)}" alt="N">exmio${tag ? `<span class="tag" data-brand="${b}">${tag}</span>` : ''}`;

function chrome() {
  const body = document.body;
  // data-nav format: "English|Danish|#anchor,English|Danish|#anchor"
  const links = (body.dataset.nav || '').split(',').filter(Boolean).map(s => { const [en, da, h] = s.split('|'); return `<a href="${h}">${T(en, da)}</a>`; }).join('');
  const back = '<a class="back" href="https://nexmio.com">← nexmio.com</a>';
  body.insertAdjacentHTML('afterbegin', `
  <div class="page-bg" id="pagebg" aria-hidden="true">
    <div class="bg-img"></div><div class="spot"></div>
  </div>
  <div class="nav"><div class="wrap">
    <a class="nx" href="/" style="font-size:26px" data-logo="${me}"></a>
    <nav class="links">${links}</nav>
    ${back}
    <button class="toggle" id="mode"></button>
  </div></div>`);
  const col = k => `<li><a href="https://${BR[k].host}">${BR[k].label}</a></li>`;
  body.insertAdjacentHTML('beforeend', `
  <footer class="site"><div class="wrap">
    <div class="cols">
      <div><a class="nx" href="https://nexmio.com" style="font-size:26px" data-logo="yellow" data-tag=""></a><p>${T('Calm tools that are yours.', 'Rolige værktøjer, der er dine.')}</p></div>
      <div><h4>${T('Products', 'Produkter')}</h4><ul>${FOOTER_PRODUCTS.map(col).join('')}</ul></div>
      <div><h4>Nexmio</h4><ul>
        <li><a href="https://nexmio.com/#about">${T('About me', 'Om mig')}</a></li>
        <li><a href="https://nexmio.com/#thinking">${T('Thinking', 'Tankegang')}</a></li>
        <li><a href="https://nexmio.com/#principles">${T('Principles', 'Principper')}</a></li>
        <li><a href="https://nexmio.com/#contact">${T('Contact', 'Kontakt')}</a></li></ul></div>
      <div><h4>${T('Project', 'Projekt')}</h4><ul><li><a href="https://github.com/nexmio/work.nexmio.com">GitHub</a></li><li><a href="privacy.html">${T('Privacy', 'Privatliv')}</a></li><li><a href="https://github.com/nexmio/work.nexmio.com/issues/new">${T('Report a bug', 'Rapportér en fejl')}</a></li></ul></div>
    </div>
    <p class="fine">${T('© Nexmio · Nexmio Work is free to use and change (Apache-2.0 with the Commons Clause).', '© Nexmio · Nexmio Work er gratis at bruge og ændre (Apache-2.0 med Commons Clause).')}</p>
  </div></footer>`);
}

/* ---- effects: mouse glow, parallax, reveal on scroll ---- */
function life() {
  const bg = document.getElementById('pagebg');
  addEventListener('pointermove', e => {
    bg.style.setProperty('--mx', e.clientX + 'px'); bg.style.setProperty('--my', e.clientY + 'px');
    bg.style.setProperty('--px', (e.clientX / innerWidth - .5).toFixed(3)); bg.style.setProperty('--py', (e.clientY / innerHeight - .5).toFixed(3));
  }, { passive: true });
  document.querySelectorAll('.product, .step, .panel, .feature').forEach(el => el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));
  const items = document.querySelectorAll('.product, .step, .panel, .feature, .cta, .sec-title, .lead, .eyebrow');
  items.forEach((el, i) => { el.classList.add('reveal'); el.style.setProperty('--rd', (i % 4) * 0.08 + 's'); });
  if (!('IntersectionObserver' in window)) { items.forEach(el => el.classList.remove('reveal')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { const t = e.target; t.classList.add('in'); io.unobserve(t); setTimeout(() => t.classList.remove('reveal', 'in'), 1100); }
  }), { threshold: .12 });
  items.forEach(el => io.observe(el));
}

/* ---- highlight the menu item for the section in view ---- */
function spy() {
  const links = [...document.querySelectorAll('.nav nav.links a[href^="#"]')];
  const secs = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if (!secs.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-35% 0px -55% 0px' });
  secs.forEach(s => io.observe(s));
}

document.addEventListener('DOMContentLoaded', () => {
  chrome();
  document.querySelectorAll('[data-logo]').forEach(el => {
    const b = el.dataset.logo;
    el.innerHTML = logoHTML(b, el.dataset.tag !== undefined ? el.dataset.tag : BR[b].tag);
  });
  document.querySelectorAll('[data-logo-img]').forEach(el => { el.innerHTML = `<img src="${IMG}${me}/mark.png" alt="N">`; });

  const modeBtn = document.getElementById('mode');
  const modeLabel = () => modeBtn.innerHTML = root.dataset.mode === 'dark' ? T('☀ Light', '☀ Lys') : T('☾ Dark', '☾ Mørk');
  modeLabel();
  modeBtn.onclick = () => { applyMode(root.dataset.mode === 'dark' ? 'light' : 'dark'); modeLabel(); };


  life();
  spy();
  if (!document.body.dataset.title) document.title = `${BR[me].name}${BR[me].tag ? ' ' + BR[me].tag : ''}`;
  const ic = document.createElement('link'); ic.rel = 'icon'; ic.href = `${IMG}favicon.ico`; document.head.appendChild(ic);
});
