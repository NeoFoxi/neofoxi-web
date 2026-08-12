/**
 * Site entry point — wires shared modules into this specific page.
 * This is the only file that knows about site-specific layout elements.
 */

import { fetchGitHubStats } from './src/github/index.js';
import { getTheme, toggleTheme } from './src/theme/index.js';
import { createSocialButton } from './src/social/index.js';
import { createStatCard } from './src/stats/index.js';
import { renderFooter } from './src/footer/index.js';

/* ---- Theme is already applied by inline script in <head>.
   Only wire the toggle button here. ---- */
const toggleBtn = document.getElementById('theme-toggle');
toggleBtn.innerHTML = getTheme() === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
toggleBtn.addEventListener('click', () => {
  const theme = toggleTheme();
  toggleBtn.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

/* ---- Stats cards (round boxes) ---- */
const statsContainer = document.getElementById('stats');

const reposCard = createStatCard('...', 'repositories', true);
const commitsCard = createStatCard('...', 'commits / 30d', true);
statsContainer.appendChild(reposCard);
statsContainer.appendChild(commitsCard);

/* Fetch GitHub stats and update cards */
(async () => {
  try {
    const stats = await fetchGitHubStats("NeoFoxi");
    if (stats !== null) {
      reposCard.querySelector('.stat-card-value').textContent = stats.repos;
      reposCard.querySelector('.stat-card-value').classList.remove('loading');
      commitsCard.querySelector('.stat-card-value').textContent = stats.commits;
      commitsCard.querySelector('.stat-card-value').classList.remove('loading');
    } else {
      reposCard.querySelector('.stat-card-value').textContent = '—';
      reposCard.querySelector('.stat-card-value').classList.remove('loading');
      commitsCard.querySelector('.stat-card-value').textContent = '—';
      commitsCard.querySelector('.stat-card-value').classList.remove('loading');
    }
  } catch {
    reposCard.querySelector('.stat-card-value').textContent = '—';
    reposCard.querySelector('.stat-card-value').classList.remove('loading');
    commitsCard.querySelector('.stat-card-value').textContent = '—';
    commitsCard.querySelector('.stat-card-value').classList.remove('loading');
  }
})();

/* ---- Site config ---- */
const SITE = {
  email: 'm@neofoxi.net',
  links: {
    github: '/github',
    patreon: '/patreon',
    youtube: '/youtube',
  },
};

/* ---- Render social buttons ---- */
const container = document.getElementById('social-links');

container.appendChild(
  createSocialButton({
    href: SITE.links.github,
    label: 'GitHub',
    icon: 'fa-brands fa-github',
    badge: 'repos',
  }),
);

container.appendChild(
  createSocialButton({
    href: SITE.links.patreon,
    label: 'Patreon',
    icon: 'fa-brands fa-patreon',
    badge: 'membership',
  }),
);

container.appendChild(
  createSocialButton({
    href: SITE.links.youtube,
    label: 'YouTube',
    icon: 'fa-brands fa-youtube',
    badge: 'channel',
  }),
);

/* ---- Render footer ---- */
const footerEl = document.getElementById('footer-content');
footerEl.appendChild(renderFooter(SITE));
