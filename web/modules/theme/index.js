/**
 * Theme manager — cookie-persisted dark/light mode.
 * No DOM assumptions beyond `document.documentElement.dataset.theme`.
 */

const COOKIE_NAME = 'theme';
const DAYS = 365;

function readCookie() {
  const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`));
  return match ? match[2] : null;
}

function writeCookie(value) {
  document.cookie = `${COOKIE_NAME}=${value};path=/;max-age=${DAYS * 86400};SameSite=Lax`;
}

/** Return the persisted theme ('light' or 'dark'), defaulting to 'light'. */
export function getTheme() {
  return readCookie() || 'light';
}

/** Apply a theme and persist it. */
export function setTheme(theme) {
  writeCookie(theme);
  document.documentElement.dataset.theme = theme;
}

/** Toggle between light and dark. Returns the new theme. */
export function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

/**
 * Wire a theme toggle button: sets the initial icon and flips the theme
 * (plus icon) on click.
 *
 * @param {HTMLButtonElement} button
 */
export function initThemeToggle(button) {
  const icon = (theme) =>
    theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  button.innerHTML = icon(getTheme());
  button.addEventListener('click', () => {
    button.innerHTML = icon(toggleTheme());
  });
}
