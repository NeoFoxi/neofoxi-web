/**
 * Footer module — renders the site footer with email and social buttons.
 * Fully driven by config, no hardcoded values.
 *
 * @param {{ email: string, links: { github: string, patreon: string, youtube: string } }} cfg
 * @returns {DocumentFragment}
 */

const SOCIAL_DEFS = [
  { key: 'github',  icon: 'fa-brands fa-github', label: 'GitHub' },
  { key: 'patreon', icon: 'fa-brands fa-patreon', label: 'Patreon' },
  { key: 'youtube', icon: 'fa-brands fa-youtube', label: 'YouTube' },
];

/** Create a small pill-shaped social link for the footer. */
function createSocialLink(href, icon, label) {
  const a = document.createElement('a');
  a.href = href;
  a.className = 'footer-social-btn';
  a.setAttribute('aria-label', label);
  a.innerHTML = `<i class="footer-social-icon ${icon}"></i> ${label}`;
  return a;
}

/** Create the email link showing the actual address. */
function createEmailLink(email) {
  const a = document.createElement('a');
  a.href = `mailto:${email}`;
  a.className = 'footer-email';
  a.textContent = email;
  return a;
}

export function renderFooter(cfg) {
  const frag = document.createDocumentFragment();

  // Email link (left side)
  frag.appendChild(createEmailLink(cfg.email));

  // Social links (right side)
  const socialGroup = document.createElement('div');
  socialGroup.className = 'footer-socials';
  for (const def of SOCIAL_DEFS) {
    const href = cfg.links[def.key];
    if (href) {
      socialGroup.appendChild(createSocialLink(href, def.icon, def.label));
    }
  }
  frag.appendChild(socialGroup);

  return frag;
}
