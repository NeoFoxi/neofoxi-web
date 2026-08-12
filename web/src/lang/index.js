/**
 * Language manager — cookie-persisted locale with browser-language detection.
 * Lazy-loads JSON translation files from /lang/{code}.json.
 * No DOM assumptions beyond `document.documentElement.lang`.
 */

const COOKIE_NAME = 'lang';
const DAYS = 365;
const SUPPORTED = ['en', 'de', 'fr', 'es', 'zh-CN'];
const FALLBACK = 'en';

/** Native-language display names for the dropdown. */
const LANG_NAMES = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Fran\u00e7ais',
  es: 'Espa\u00f1ol',
  'zh-CN': '\u7b80\u4f53\u4e2d\u6587',
};

let currentLang = FALLBACK;
let translations = {};
let listeners = [];

/* ---------- helpers ---------- */

function readCookie() {
  const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`));
  return match ? match[2] : null;
}

function writeCookie(value) {
  document.cookie = `${COOKIE_NAME}=${value};path=/;max-age=${DAYS * 86400};SameSite=Lax`;
}

/** Detect the user's preferred language from the browser. */
function detectBrowserLang() {
  const raw = navigator.language || navigator.userLanguage || '';
  const normalized = raw.toLowerCase();

  // Handle Chinese variants
  if (normalized === 'zh-cn' || normalized === 'zh-hans') return 'zh-CN';
  if (normalized.startsWith('zh')) return 'zh-CN';

  const short = raw.slice(0, 2);
  return SUPPORTED.includes(short) ? short : FALLBACK;
}

/** Fetch and parse a lang JSON file. */
async function load(code) {
  const url = `/lang/${code}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load language file: ${url}`);
  return await res.json();
}

/** Resolve a dot-delimited path into a nested object. */
function resolve(obj, path) {
  return path.split('.').reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
}

/* ---------- public API ---------- */

/** Initialise — reads cookie, falls back to browser detection, loads translations. */
export async function init() {
  const stored = readCookie();
  const code = stored || detectBrowserLang();
  currentLang = code;
  document.documentElement.lang = code;
  translations = await load(code);
}

/** Return the active language code (e.g. 'en', 'de', 'zh-CN'). */
export function getLang() {
  return currentLang;
}

/** Switch to a different language, persist it, and notify subscribers. */
export async function setLang(code) {
  if (!SUPPORTED.includes(code)) return;
  writeCookie(code);
  document.documentElement.lang = code;
  currentLang = code;
  translations = await load(code);
  listeners.forEach(fn => fn(code));
}

/** Translate a dot-path key. Returns the key itself if not found. */
export function t(key) {
  const value = resolve(translations, key);
  return value != null ? value : key;
}

/** Subscribe to language changes. Returns an unsubscribe function. */
export function onChange(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter(f => f !== fn);
  };
}

/** Get the list of supported language codes. */
export function getSupportedLangs() {
  return [...SUPPORTED];
}

/** Get the native display name for a language code. */
export function getLangName(code) {
  return LANG_NAMES[code] || code;
}

/**
 * Populate a <select> element with all supported language options.
 * Keeps existing options, appends new ones. Safe to call multiple times.
 */
export function populateLangSelect(selectEl) {
  // Clear existing options first so calling this multiple times is safe
  selectEl.innerHTML = '';
  getSupportedLangs().forEach(code => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = getLangName(code);
    selectEl.appendChild(opt);
  });
}

/* ---------- custom dropdown ---------- */

let customDropdownInstance = null;

/**
 * Create a custom-styled language selector dropdown.
 * Replaces the native <select> with a button + popup menu.
 *
 * @param {string} initialLang - Language code to select initially.
 * @param {(code: string) => void} onChangeCb - Called when user picks a language.
 * @returns {HTMLElement} The custom dropdown container.
 */
export function createCustomLangSelect(initialLang, onChangeCb) {
  const wrapper = document.createElement('div');
  wrapper.className = 'custom-lang-select';

  const trigger = document.createElement('button');
  trigger.className = 'custom-lang-select__trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-label', 'Select language');

  const triggerLabel = document.createElement('span');
  triggerLabel.className = 'custom-lang-select__label';
  triggerLabel.textContent = getLangName(initialLang);

  const arrow = document.createElement('span');
  arrow.className = 'custom-lang-select__arrow';
  arrow.setAttribute('aria-hidden', 'true');

  trigger.appendChild(triggerLabel);
  trigger.appendChild(arrow);

  const menu = document.createElement('ul');
  menu.className = 'custom-lang-select__menu';
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-label', 'Select language');
  menu.id = 'custom-lang-menu';

  const items = [];
  getSupportedLangs().forEach(code => {
    const item = document.createElement('li');
    item.className = 'custom-lang-select__option';
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', code === initialLang ? 'true' : 'false');
    item.dataset.value = code;
    item.textContent = getLangName(code);
    if (code === initialLang) item.classList.add('is-selected');

    item.addEventListener('click', () => selectLang(code));
    menu.appendChild(item);
    items.push(item);
  });

  wrapper.appendChild(trigger);
  wrapper.appendChild(menu);

  let open = false;

  function selectLang(code) {
    if (code === getLang()) {
      close();
      return;
    }
    triggerLabel.textContent = getLangName(code);
    triggerLabel.classList.remove('is-animating');
    // Force reflow so the animation re-triggers
    void triggerLabel.offsetWidth;
    triggerLabel.classList.add('is-animating');
    items.forEach(el => {
      el.classList.toggle('is-selected', el.dataset.value === code);
      el.setAttribute('aria-selected', el.dataset.value === code ? 'true' : 'false');
    });
    close();
    onChangeCb(code);
  }

  function openMenu() {
    open = true;
    wrapper.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    // position menu
    const rect = trigger.getBoundingClientRect();
    menu.style.minWidth = `${Math.max(rect.width, 140)}px`;
  }

  function close() {
    open = false;
    wrapper.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (open) close();
    else openMenu();
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (open && !wrapper.contains(e.target)) close();
  });

  // Keyboard navigation
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      openMenu();
    }
  });

  menu.addEventListener('keydown', (e) => {
    const idx = items.findIndex(el => el.dataset.value === getLang());
    let nextIdx = idx;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        nextIdx = (idx + 1) % items.length;
        break;
      case 'ArrowUp':
        e.preventDefault();
        nextIdx = (idx - 1 + items.length) % items.length;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (idx >= 0) selectLang(items[idx].dataset.value);
        return;
      case 'Escape':
        e.preventDefault();
        close();
        return;
      default:
        return;
    }

    items[nextIdx].focus();
  });

  // Sync when language changes externally
  if (!customDropdownInstance) {
    onChange(code => {
      triggerLabel.textContent = getLangName(code);
      triggerLabel.classList.remove('is-animating');
      void triggerLabel.offsetWidth;
      triggerLabel.classList.add('is-animating');
      items.forEach(el => {
        el.classList.toggle('is-selected', el.dataset.value === code);
        el.setAttribute('aria-selected', el.dataset.value === code ? 'true' : 'false');
      });
    });
  }

  customDropdownInstance = wrapper;
  return wrapper;
}
