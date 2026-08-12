/**
 * GitHub commit counter — purely functional, no DOM coupling.
 * Fetches the number of commits made by the given user in the last 30 days,
 * across all their own repos.
 *
 * Returns a Promise that resolves to { commits, repos } or null on error.
 */

const GITHUB_API = 'https://api.github.com';
const DAYS = 30;
const SINCE = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString();

export async function fetchGitHubStats(username) {
  if (!username || username === 'your-github-username') return null;

  const repos = await fetchAllOwnedRepos(username);
  if (!repos || repos.length === 0) return null;

  let totalCommits = 0;
  for (const repo of repos) {
    // Skip repos not pushed to in the last 30 days — saves API calls
    if (Date.parse(repo.pushed_at) < Date.now() - DAYS * 24 * 60 * 60 * 1000) {
      continue;
    }

    // Polite delay to avoid secondary rate limits
    await new Promise((r) => setTimeout(r, 200));

    const count = await countRepoCommits(username, repo.name);
    if (count !== null) totalCommits += count;
  }

  return {
    commits: totalCommits,
    repos: repos.length,
  };
}

/* ---- helpers ---- */

async function fetchAllOwnedRepos(username) {
  try {
    const res = await fetch(
      `${GITHUB_API}/users/${username}/repos?per_page=50&sort=pushed&type=owner`,
      { headers: { Accept: 'application/vnd.github.v3+json' } },
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function countRepoCommits(owner, repo) {
  try {
    const res = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/commits?since=${SINCE}&author=${owner}&per_page=100`,
      { headers: { Accept: 'application/vnd.github.v3+json' } },
    );
    if (!res.ok) return null;
    const body = await res.json();
    return Array.isArray(body) ? body.length : null;
  } catch {
    return null;
  }
}
