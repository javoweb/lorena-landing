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

function applyDensity() {
  const grid = document.getElementById('galeria-grid');
  grid.classList.remove('dense-low', 'dense-med', 'dense-high');
  grid.classList.add(state.density);
  document.querySelectorAll('[data-density]').forEach(b => {
    b.classList.toggle('active', b.dataset.density === state.density);
  });
}

function applyAll() { applyDensity(); applyContent(); }

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
