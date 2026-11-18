/**
 * Stats section — renders GitHub stat cards with loading, count-up and
 * error states. Data comes from the github module (cached + deduped);
 * this module owns all DOM rendering for the section.
 */

import { t } from '../lang/index.js';
import { fetchGitHubStats, getCachedGitHubStats } from '../github/index.js';

/**
 * Create a stat card element for GitHub statistics.
 *
 * @param {string} value  - Display value (e.g. "42" or "...").
 * @param {string} label  - Label text (e.g. "repositories").
 * @param {boolean} [loading=false] - Whether to show a loading state.
 * @returns {HTMLDivElement}
 */
export function createStatCard(value, label, loading) {
  const div = document.createElement('div');
  div.className = 'stat-card';

  const val = document.createElement('span');
  val.className = `stat-card-value${loading ? ' loading' : ''}`;
  val.textContent = value;
  div.appendChild(val);

  const lbl = document.createElement('span');
  lbl.className = 'stat-card-label';
  lbl.textContent = label;
  div.appendChild(lbl);

  return div;
}

/**
 * Start the GitHub fetch as early as possible. Safe to call repeatedly:
 * the github module dedups concurrent calls and serves fresh cache hits.
 *
 * @param {string} username
 * @returns {Promise<{ commits: number, repos: number } | null>}
 */
export function prefetchStats(username) {
  return fetchGitHubStats(username).catch(() => null);
}

/**
 * Render the stats section: instant from cache when fresh, otherwise
 * loading cards that fill in (with count-up) once the fetch resolves.
 *
 * @param {HTMLElement} container - Stats section container.
 * @param {object} opts
 * @param {HTMLElement} opts.sourceEl - "Live from GitHub" caption element.
 * @param {string} opts.username - GitHub username to fetch stats for.
 * @param {() => boolean} [opts.isStale] - Return true when this render was
 *   superseded (e.g. by a language change) and results should be ignored.
 */
export function renderStats(container, { sourceEl, username, isStale = () => false } = {}) {
  container.innerHTML = '';

  const cached = getCachedGitHubStats();
  const ready = cached !== null;

  const reposCard = createStatCard(ready ? cached.repos : '...', t('stats.repositories'), !ready);
  reposCard.classList.add('animate-scale-in', 'animate-delay-1');
  const commitsCard = createStatCard(ready ? cached.commits : '...', t('stats.commits'), !ready);
  commitsCard.classList.add('animate-scale-in', 'animate-delay-2');
  container.appendChild(reposCard);
  container.appendChild(commitsCard);

  sourceEl.classList.toggle('loading', !ready);
  sourceEl.classList.remove('error');

  // Fresh cached data already rendered — nothing left to fetch.
  if (ready) return;

  prefetchStats(username).then((stats) => {
    if (isStale()) return; // stale render — ignore
    sourceEl.classList.remove('loading');
    if (stats !== null) {
      animateCountUp(reposCard.querySelector('.stat-card-value'), stats.repos);
      reposCard.querySelector('.stat-card-value').classList.remove('loading');
      animateCountUp(commitsCard.querySelector('.stat-card-value'), stats.commits);
      commitsCard.querySelector('.stat-card-value').classList.remove('loading');
    } else {
      setStatsError(sourceEl, [reposCard, commitsCard]);
    }
  });
}

/** Show an error state on the cards and caption. */
function setStatsError(sourceEl, cards) {
  sourceEl.classList.add('error');
  for (const card of cards) {
    const val = card.querySelector('.stat-card-value');
    val.textContent = '—';
    val.classList.remove('loading');
  }
}

/** Animate a numeric value counting up from 0 to `target`. */
function animateCountUp(el, target, duration = 1000) {
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
