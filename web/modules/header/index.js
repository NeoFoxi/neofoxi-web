/**
 * Site header — wires the shared header chrome (theme toggle button and
 * language dropdown) into the page markup. Both entry points call this
 * once at boot instead of duplicating the wiring.
 */

import { init, getLang, setLang, createCustomLangSelect } from '../lang/index.js';
import { initThemeToggle } from '../theme/index.js';

/**
 * Initialise the header: wire the theme toggle immediately, then — once
 * translations are loaded — replace `#lang-select` with the custom dropdown.
 */
export async function initHeader() {
  initThemeToggle(document.getElementById('theme-toggle'));

  await init();

  const langSelect = document.getElementById('lang-select');
  langSelect.replaceWith(createCustomLangSelect(getLang(), setLang));
}
