/**
 * Footer module — renders the site footer with email, license links and
 * social buttons. Social links are driven by config.
 *
 * @param {{ email: string, links: { github: string, youtube: string, discord: string } }} cfg
 * @returns {DocumentFragment}
 */

import { t } from '../lang/index.js';

const SOCIAL_DEFS = [
  { key: 'github',  icon: 'fa-brands fa-github', label: 'GitHub' },
  { key: 'youtube', icon: 'fa-brands fa-youtube', label: 'YouTube' },
  { key: 'discord', icon: 'fa-brands fa-discord', label: 'Discord' },
];

const LEGAL_DEFS = [
  { href: '/privacy/', key: 'footer.privacy' },
  { href: 'https://github.com/rsms/inter/blob/master/LICENSE.txt', key: 'footer.interLicense' },
  { href: 'https://fontawesome.com/license/free', key: 'footer.fontAwesomeLicense' },
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

/** Create a plain footer link (privacy page, license files). */
function createLegalLink(href, label) {
  const a = document.createElement('a');
  a.href = href;
  a.className = 'footer-legal-link';
  a.textContent = label;
  return a;
}

export function renderFooter(cfg) {
  const frag = document.createDocumentFragment();

  // Left group: license links
  const leftGroup = document.createElement('div');
  leftGroup.className = 'footer-left';
  for (const def of LEGAL_DEFS) {
    leftGroup.appendChild(createLegalLink(def.href, t(def.key)));
  }
  frag.appendChild(leftGroup);

  // Contact and social links (right side)
  const socialGroup = document.createElement('div');
  socialGroup.className = 'footer-socials';
  socialGroup.appendChild(createSocialLink(`mailto:${cfg.email}`, 'fas fa-envelope', t('social.email')));
  for (const def of SOCIAL_DEFS) {
    const href = cfg.links[def.key];
    if (href) {
      socialGroup.appendChild(createSocialLink(href, def.icon, def.label));
    }
  }
  frag.appendChild(socialGroup);

  return frag;
}
