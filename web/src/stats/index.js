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
