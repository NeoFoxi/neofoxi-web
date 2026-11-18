/**
 * GitHub statistics — purely functional, no DOM coupling.
 *
 * Counts the user's commits (last 30 days) and owned repos using the GitHub
 * Search API, which returns totals in a single request each. Both requests run
 * in parallel, so a whole stats fetch needs just 2 HTTP calls instead of one
 * per repo (with a delay between each) — far faster and lighter on the API.
 *
 * Note on scope: commit search counts commits *authored* by the user across
 * all public repos. For most users that is effectively their own activity, but
 * it can be slightly broader than the previous own-repos-only count. This is
 * the tradeoff that buys the single-request speedup.
 *
 * Results are cached (with TTL) and concurrent callers share the same
 * in-flight request, so language re-renders never trigger duplicate fetches.
 *
 * fetchGitHubStats(username) resolves to { commits, repos } or null on error.
 */

const GITHUB_API = 'https://api.github.com';
const DAYS = 30;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const REQUEST_TIMEOUT = 15000; // ms

// Commit search requires a preview media type.
const COMMIT_ACCEPT = 'application/vnd.github.cloak-preview+json';

let inFlight = null; // shared Promise while a fetch is running
let cached = null;   // last successful result
let cachedAt = 0;

/**
 * Fetch GitHub stats, deduplicating concurrent calls and short-circuiting on
 * a fresh cache entry.
 *
 * @param {string} username
 * @param {{ force?: boolean }} [opts] - force = bypass the cache.
 * @returns {Promise<{ commits: number, repos: number } | null>}
 */
export function fetchGitHubStats(username, { force = false } = {}) {
  if (!username || username === 'your-github-username') return Promise.resolve(null);

  // Return a shared in-flight request so parallel calls don't double-fetch.
  if (!force && inFlight) return inFlight;

  // Serve a fresh cache hit synchronously-backed (still async contract).
  if (!force && cached && Date.now() - cachedAt < CACHE_TTL) {
    return Promise.resolve(cached);
  }

  inFlight = load(username)
    .then((data) => {
      // Only cache real results; don't pin transient errors for the TTL.
      if (data !== null) {
        cached = data;
        cachedAt = Date.now();
      }
      return data;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/** Return the currently cached result, or null if none is fresh. */
export function getCachedGitHubStats() {
  return cached && Date.now() - cachedAt < CACHE_TTL ? cached : null;
}

/* ---- internals ---- */

async function load(username) {
  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10); // YYYY-MM-DD

  // Run both independent searches in parallel — this is the big win.
  const [repos, commits] = await Promise.all([
    fetchRepoCount(username),
    fetchCommitCount(username, since),
  ]);

  if (repos === null || commits === null) return null;
  return { commits, repos };
}

/** Count owned (non-fork) repos via the repository search API. */
async function fetchRepoCount(username) {
  try {
    const res = await fetchWithTimeout(
      `${GITHUB_API}/search/repositories?q=${encodeURIComponent(`user:${username} fork:false`)}&per_page=1`,
      { headers: { Accept: 'application/vnd.github.v3+json' } },
    );
    if (!res.ok) return null;
    const body = await res.json();
    return typeof body.total_count === 'number' ? body.total_count : null;
  } catch {
    return null;
  }
}

/** Count commits by the user in the last `since` days via the commit search API. */
async function fetchCommitCount(username, since) {
  try {
    const q = `author:${username} committer-date:>=${since}`;
    const res = await fetchWithTimeout(
      `${GITHUB_API}/search/commits?q=${encodeURIComponent(q)}&per_page=1`,
      { headers: { Accept: COMMIT_ACCEPT } },
    );
    if (!res.ok) return null;
    const body = await res.json();
    return typeof body.total_count === 'number' ? body.total_count : null;
  } catch {
    return null;
  }
}

/** fetch() with a hard timeout so a stalled request can't block the UI. */
function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => {
    clearTimeout(timer);
  });
}
