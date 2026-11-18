/**
 * Social links module — creates individual social buttons and renders the
 * full "Find me on" link list from site config.
 */

import { t } from '../lang/index.js';

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

/**
 * Render the social links list into a container. Labels and badges are
 * translated; the email button always shows the raw address.
 *
 * @param {HTMLElement} container
 * @param {{ email: string, links: { github: string, youtube: string, discord: string } }} cfg
 */
export function renderSocialLinks(container, { email, links }) {
  container.innerHTML = '';

  // `label` is a literal (the email address); `labelKey`/`badgeKey` are
  // translation keys resolved at render time.
  const defs = [
    { href: `mailto:${email}`, label: email, icon: 'fas fa-envelope', badgeKey: 'social.badgeContact', delay: 0 },
    { href: links.github, labelKey: 'social.github', icon: 'fa-brands fa-github', badgeKey: 'social.badgeRepos', delay: 1 },
    { href: links.youtube, labelKey: 'social.youtube', icon: 'fa-brands fa-youtube', badgeKey: 'social.badgeChannel', delay: 2 },
    { href: links.discord, labelKey: 'social.discord', icon: 'fa-brands fa-discord', badgeKey: 'social.badgeProfile', delay: 3 },
  ];

  for (const { href, label, labelKey, icon, badgeKey, delay } of defs) {
    const btn = createSocialButton({
      href,
      label: label || t(labelKey),
      icon,
      badge: t(badgeKey),
    });
    btn.classList.add('animate-fade-in-up', `animate-delay-${delay}`);
    container.appendChild(btn);
  }
}
