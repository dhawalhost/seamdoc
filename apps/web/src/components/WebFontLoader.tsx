/** Loads selected Google Fonts for live preview (not used at export time). */

import { useEffect } from 'react';
import { googleFontsStylesheetUrl, webFontsToLoad } from '../lib/fontCatalog';

const LINK_ID = 'seamdoc-web-fonts';

interface WebFontLoaderProps {
  families: readonly string[];
}

export function WebFontLoader({ families }: WebFontLoaderProps) {
  useEffect(() => {
    const webFamilies = webFontsToLoad(families);
    const href = googleFontsStylesheetUrl(webFamilies);
    const existing = document.getElementById(LINK_ID);

    if (href === null) {
      existing?.remove();
      return;
    }

    if (existing instanceof HTMLLinkElement) {
      if (existing.href !== href) {
        existing.href = href;
      }
      return;
    }

    const link = document.createElement('link');
    link.id = LINK_ID;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }, [families]);

  return null;
}
