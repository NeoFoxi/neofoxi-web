/**
 * Privacy page entry point — same theme/language controls as the main site.
 */

import {
  init, t, getLang, setLang, onChange, createCustomLangSelect,
} from '../modules/lang/index.js';
import { getTheme, toggleTheme } from '../modules/theme/index.js';

const toggleBtn = document.getElementById('theme-toggle');
const langSelect = document.getElementById('lang-select');

/* ---- Theme toggle ---- */
toggleBtn.innerHTML = getTheme() === 'dark'
  ? '<i class="fas fa-sun"></i>'
  : '<i class="fas fa-moon"></i>';
toggleBtn.addEventListener('click', () => {
  const theme = toggleTheme();
  toggleBtn.innerHTML = theme === 'dark'
    ? '<i class="fas fa-sun"></i>'
    : '<i class="fas fa-moon"></i>';
});

/* ---- Render translations ---- */
function render() {
  document.querySelectorAll('[data-lang]').forEach(el => {
    el.textContent = t(el.getAttribute('data-lang'));
  });
  document.querySelectorAll('[data-lang-html]').forEach(el => {
    el.innerHTML = t(el.getAttribute('data-lang-html'));
  });
  document.title = `${t('privacy.title')} \u2014 NeoFoxi`;
}

/* ---- Boot ---- */
async function main() {
  await init();
  langSelect.replaceWith(createCustomLangSelect(getLang(), setLang));
  onChange(render);
  render();
}

main();
