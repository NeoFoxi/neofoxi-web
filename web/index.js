/**
 * Site entry point — wires shared modules into this specific page.
 * This is the only file that knows about site-specific config and layout
 * element IDs; all rendering lives in the modules.
 *
 * Critical modules (header: theme + lang) are statically imported for the
 * first paint. Non-critical modules (stats, social, footer) are loaded via
 * dynamic import() after the hero renders.
 */

import { initHeader } from './modules/header/index.js';
import { applyTranslations, onChange } from './modules/lang/index.js';
import { observeReveal } from './modules/animations/index.js';

const SITE = {
  email: 'm@neofoxi.net',
  username: 'NeoFoxi',
  links: {
    github: 'https://github.com/NeoFoxi',
    youtube: 'https://youtube.com/@NeoFoxi',
    discord: 'https://discord.com/users/1416514573900714055',
  },
};

// Start loading the stats module — and the GitHub fetch it triggers via
// prefetchStats() — in parallel with everything else so the fetch begins
// as early as possible.
const statsModulePromise = import('./modules/stats/index.js');
statsModulePromise.then((m) => m.prefetchStats(SITE.username)).catch(() => {});

/* ---------- render (re-runs on lang change) ---------- */

let renderGen = 0;
let cleanupReveal = null;

async function render() {
  const gen = ++renderGen;
  // Only play scroll-reveal animations on the initial render; re-renders
  // (e.g. after a language change) must not replay them.
  const isInitialRender = gen === 1;

  // ── Phase 1: Critical (translations) ──
  applyTranslations();

  // ── Phase 2: Non-critical modules (load in parallel) ──
  const [{ renderStats }, { renderSocialLinks }, { renderFooter }] = await Promise.all([
    statsModulePromise,
    import('./modules/social/index.js'),
    import('./modules/footer/index.js'),
  ]);

  // Stats — renderStats renders instantly from cache if present, else
  // shows loading cards and fetches.
  renderStats(document.getElementById('stats'), {
    sourceEl: document.querySelector('.stats-source'),
    username: SITE.username,
    isStale: () => gen !== renderGen,
  });

  // Social links
  renderSocialLinks(document.getElementById('social-links'), SITE);

  // Footer
  document.getElementById('footer-content').replaceChildren(renderFooter(SITE));

  // Observe scroll-reveal elements (cleanup previous observation first);
  // reveal instantly on re-renders so animations never replay.
  if (cleanupReveal) cleanupReveal();
  cleanupReveal = observeReveal(document, !isInitialRender);
}

/* ---------- boot ---------- */

async function main() {
  await initHeader();
  onChange(render);
  render();
}

main();
