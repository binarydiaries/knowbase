import { getConfig } from './config';
import { createLauncher } from './launcher';
import { setupMessageListener } from './listener';

(() => {
  if ((window as any).__KB_EMBED__) return;
  (window as any).__KB_EMBED__ = true;

  const config = getConfig();

  if (!config.chatbotId) {
    console.warn('KnowBase: chatbotId missing');
    return;
  }

  const chatUrl = `http://localhost:4000/?chatbotId=${config.chatbotId}`;

  setupMessageListener();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () =>
      createLauncher(chatUrl),
    );
  } else {
    createLauncher(chatUrl);
  }
})();
