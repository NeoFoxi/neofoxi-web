/**
 * Site entry point — wires shared modules into this specific page.
 * This is the only file that knows about site-specific layout elements.
 *
 * Critical modules (theme, lang) are statically imported for the
 * first paint. Non-critical modules (stats, github, social, footer) are
 * loaded via dynamic import() after the hero renders.
 */

import { getTheme, toggleTheme } from './src/theme/index.js';
import {
  init, t, getLang, setLang, onChange,
  createCustomLangSelect,
} from './src/lang/index.js';
import { observeReveal } from './src/animations/index.js';

/* ---------- one-time setup ---------- */

const toggleBtn = document.getElementById('theme-toggle');
const langSelect = document.getElementById('lang-select');
const statsContainer = document.getElementById('stats');
const statsSource = document.querySelector('.stats-source');
const socialContainer = document.getElementById('social-links');
const footerEl = document.getElementById('footer-content');

const SITE = {
  email: 'm@neofoxi.net',
  links: {
    github: '/github',
    patreon: '/patreon',
    youtube: '/youtube',
  },
};

/* ---- Theme toggle ---- */
toggleBtn.innerHTML = getTheme() === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
toggleBtn.addEventListener('click', () => {
  const theme = toggleTheme();
  toggleBtn.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

/* ---------- GitHub stats ---------- */

// Start loading the module in parallel with everything else so the fetch
// begins as early as possible. The module dedups concurrent calls.
const githubModulePromise = import('./src/github/index.js');

function renderStats(gen, stats, createStatCard) {
  statsContainer.innerHTML = '';

  const ready = stats !== null;
  const reposCard = createStatCard(ready ? stats.repos : '...', t('stats.repositories'), !ready, SITE.links.github);
  reposCard.classList.add('animate-scale-in', 'animate-delay-1');
  const commitsCard = createStatCard(ready ? stats.commits : '...', t('stats.commits'), !ready, SITE.links.github);
  commitsCard.classList.add('animate-scale-in', 'animate-delay-2');
  statsContainer.appendChild(reposCard);
  statsContainer.appendChild(commitsCard);

  statsSource.classList.toggle('loading', !ready);
  statsSource.classList.remove('error');

  // Fresh cached data already rendered — nothing left to fetch.
  if (ready) return;

  githubModulePromise.then(({ fetchGitHubStats }) =>
    fetchGitHubStats('NeoFoxi'),
  ).then((nextStats) => {
    if (gen !== renderGen) return; // stale render — ignore
    statsSource.classList.remove('loading');
    if (nextStats !== null) {
      animateCountUp(reposCard.querySelector('.stat-card-value'), nextStats.repos);
      reposCard.querySelector('.stat-card-value').classList.remove('loading');
      animateCountUp(commitsCard.querySelector('.stat-card-value'), nextStats.commits);
      commitsCard.querySelector('.stat-card-value').classList.remove('loading');
    } else {
      setStatsError(reposCard, commitsCard);
    }
  }).catch(() => {
    if (gen !== renderGen) return;
    statsSource.classList.remove('loading');
    setStatsError(reposCard, commitsCard);
  });
}

function setStatsError(reposCard, commitsCard) {
  statsSource.classList.add('error');
  for (const card of [reposCard, commitsCard]) {
    const val = card.querySelector('.stat-card-value');
    val.textContent = '—';
    val.classList.remove('loading');
  }
}

/* Count-up animation helper */
function animateCountUp(el, target, duration) {
  if (duration === undefined) duration = 1000;
  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = target;
    }
  }

  requestAnimationFrame(step);
}

/* ---------- render (re-runs on lang change) ---------- */

let renderGen = 0;
let cleanupReveal = null;

async function render() {
  const gen = ++renderGen;

  // ── Phase 1: Critical (translations) ──
  document.querySelectorAll('[data-lang]').forEach(el => {
    el.textContent = t(el.getAttribute('data-lang'));
  });
  document.querySelectorAll('[data-lang-html]').forEach(el => {
    el.innerHTML = t(el.getAttribute('data-lang-html'));
  });

  // ── Phase 2: Non-critical modules (load in parallel) ──
  statsContainer.innerHTML = '';
  socialContainer.innerHTML = '';
  footerEl.innerHTML = '';

  const [
    { createStatCard },
    { getCachedGitHubStats },
    { createSocialButton },
    { renderFooter },
  ] = await Promise.all([
    import('./src/stats/index.js'),
    import('./src/github/index.js'),
    import('./src/social/index.js'),
    import('./src/footer/index.js'),
  ]);

  // Stats — render instantly from cache if present, else show loading and fetch.
  renderStats(gen, getCachedGitHubStats(), createStatCard);

  // Social links
  socialContainer.appendChild(
    createSocialButton({ href: `mailto:${SITE.email}`, label: SITE.email, icon: 'fas fa-envelope', badge: t('social.badgeContact') }),
  ).classList.add('animate-fade-in-up', 'animate-delay-0');
  socialContainer.appendChild(
    createSocialButton({ href: SITE.links.github, label: t('social.github'), icon: 'fa-brands fa-github', badge: t('social.badgeRepos') }),
  ).classList.add('animate-fade-in-up', 'animate-delay-1');
  socialContainer.appendChild(
    createSocialButton({ href: SITE.links.patreon, label: t('social.patreon'), icon: 'fa-brands fa-patreon', badge: t('social.badgeMembership') }),
  ).classList.add('animate-fade-in-up', 'animate-delay-2');
  socialContainer.appendChild(
    createSocialButton({ href: SITE.links.youtube, label: t('social.youtube'), icon: 'fa-brands fa-youtube', badge: t('social.badgeChannel') }),
  ).classList.add('animate-fade-in-up', 'animate-delay-3');

  // Footer
  footerEl.appendChild(renderFooter(SITE));

  // Observe scroll-reveal elements (cleanup previous observation first)
  if (cleanupReveal) cleanupReveal();
  cleanupReveal = observeReveal();
}

/* ---------- boot ---------- */

async function main() {
  await init();
  /* ---- Create custom lang dropdown ---- */
  const langDropdown = createCustomLangSelect(getLang(), setLang);
  langSelect.replaceWith(langDropdown);
  onChange(render);
  render();
}

main();
