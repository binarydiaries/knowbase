import { getConfig } from './config';
import { createLauncher } from './launcher';
import { setupMessageListener } from './listener';

(() => {
  if ((window as any).__KB_EMBED__) return;
  (window as any).__KB_EMBED__ = true;

  const config = getConfig();

  if (!config.channelId) {
    console.warn('Agenvik: channelId missing');
    return;
  }

  const parentOrigin = encodeURIComponent(window.location.origin);
  const chatUrl = `${import.meta.env.VITE_CLIENT_BASE}?channelId=${config.channelId}&parentOrigin=${parentOrigin}`;

  setupMessageListener();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () =>
      createLauncher(chatUrl, config.primaryColor),
    );
  } else {
    createLauncher(chatUrl, config.primaryColor);
  }
})();
