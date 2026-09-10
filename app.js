let state = { density: 'dense-low', language: 'es' };

function applyContent() {
  const lang = state.language;
  const dict = i18n[lang];

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) el.innerHTML = dict[key];
  });
  document.documentElement.lang = lang;
  document.querySelectorAll('.lang-switch button').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
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
  b.addEventListener('click', () => { state.density = b.dataset.density; applyDensity(); });
});
document.querySelectorAll('[data-lang]').forEach(b => {
  b.addEventListener('click', () => { state.language = b.dataset.lang; applyContent(); });
});

applyAll();
