/**
 * Create a social-style anchor element.
 *
 * @param {{ href: string, label: string, icon: string, badge?: string }} opts
 * @returns {HTMLAnchorElement}
 */
export function createSocialButton({ href, label, icon, badge }) {
  const a = document.createElement('a');
  a.href = href;
  a.className = 'social-btn';

  const iconEl = document.createElement('i');
  iconEl.className = `social-btn-icon ${icon}`;
  a.appendChild(iconEl);

  const labelEl = document.createElement('span');
  labelEl.className = 'social-btn-label';
  labelEl.textContent = label;
  a.appendChild(labelEl);

  if (badge) {
    const badgeEl = document.createElement('span');
    badgeEl.className = 'social-btn-badge';
    badgeEl.textContent = badge;
    a.appendChild(badgeEl);
  }

  return a;
}
