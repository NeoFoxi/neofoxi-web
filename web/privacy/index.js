/**
 * Privacy page entry point — same theme/language header as the main site,
 * plus page-specific translations and title.
 */

import { initHeader } from '../modules/header/index.js';
import { applyTranslations, onChange, t } from '../modules/lang/index.js';

function render() {
  applyTranslations();
  document.title = `${t('privacy.title')} \u2014 NeoFoxi`;
}

async function main() {
  await initHeader();
  onChange(render);
  render();
}

main();
