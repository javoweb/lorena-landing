let state = { ...TWEAK_DEFAULTS };

function applyContent() {
  const lang = state.language;
  const tone = state.copyTone;
  const base = i18n[lang];
  const overrides = (lang === 'es' && tone !== 'editorial') ? copyTones[tone] : {};
  const dict = { ...base, ...overrides };

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) el.innerHTML = dict[key];
  });
  document.documentElement.lang = lang;
  document.querySelectorAll('.lang-switch button').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });
  document.querySelectorAll('[data-lang-btn]').forEach(b => {
    b.classList.toggle('active', b.dataset.langBtn === lang);
  });
}

function applyTheme() {
  document.body.dataset.theme = state.theme;
  document.querySelectorAll('[data-theme-btn]').forEach(b => {
    b.classList.toggle('active', b.dataset.themeBtn === state.theme);
  });
}

function applyDensity() {
  const grid = document.getElementById('galeria-grid');
  grid.classList.remove('dense-low', 'dense-med', 'dense-high');
  grid.classList.add(state.density);
  document.querySelectorAll('[data-density]').forEach(b => {
    b.classList.toggle('active', b.dataset.density === state.density);
  });
}

function applyAll() { applyTheme(); applyDensity(); applyContent(); }

const igGrid = document.getElementById('ig-grid');
const igCaptions = ['#poncho', '#chal', '#taller', '#otavalo', '#proceso', '#uglysweater',
                    '#mayorista', '#tradición', '#chakana', '#telar', '#artesanal', '#ecuador'];
igCaptions.forEach((cap) => {
  const el = document.createElement('div');
  el.className = 'ig-item';
  el.innerHTML = `<div class="ig-caption">${cap}</div>
    <div class="ig-overlay">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      VER
    </div>`;
  el.addEventListener('click', () => window.open('https://instagram.com/tejidos_lorena_ec', '_blank'));
  igGrid.appendChild(el);
});

document.querySelectorAll('[data-theme-btn]').forEach(b => {
  b.addEventListener('click', () => { state.theme = b.dataset.themeBtn; applyTheme(); postEdits(); });
});
document.querySelectorAll('[data-density]').forEach(b => {
  b.addEventListener('click', () => { state.density = b.dataset.density; applyDensity(); postEdits(); });
});
document.querySelectorAll('[data-lang]').forEach(b => {
  b.addEventListener('click', () => { state.language = b.dataset.lang; applyContent(); postEdits(); });
});
document.querySelectorAll('[data-lang-btn]').forEach(b => {
  b.addEventListener('click', () => { state.language = b.dataset.langBtn; applyContent(); postEdits(); });
});
document.querySelectorAll('input[name="copy-tone"]').forEach(r => {
  r.addEventListener('change', (e) => {
    if (e.target.checked) { state.copyTone = e.target.value; applyContent(); postEdits(); }
  });
});

const tweaksPanel = document.getElementById('tweaks');
window.addEventListener('message', (e) => {
  if (e.data && e.data.type === '__activate_edit_mode') tweaksPanel.classList.add('open');
  else if (e.data && e.data.type === '__deactivate_edit_mode') tweaksPanel.classList.remove('open');
});
document.getElementById('tweaks-close').addEventListener('click', () => tweaksPanel.classList.remove('open'));
window.parent.postMessage({ type: '__edit_mode_available' }, '*');

function postEdits() {
  window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { ...state } }, '*');
}

applyAll();
