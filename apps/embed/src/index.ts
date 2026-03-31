import { getConfig } from './config';
import { createLauncher } from './launcher';
import { setupMessageListener } from './listener';

(() => {
  if ((window as any).__KB_EMBED__) return;
  (window as any).__KB_EMBED__ = true;

  const config = getConfig();

  if (!config.channelId) {
    console.warn('KnowBase: channelId missing');
    return;
  }

  const chatUrl = `${import.meta.env.VITE_CLIENT_BASE}?channelId=${config.channelId}&orgId=${config.orgId}`;

  setupMessageListener();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () =>
      createLauncher(chatUrl),
    );
  } else {
    createLauncher(chatUrl);
  }
})();
