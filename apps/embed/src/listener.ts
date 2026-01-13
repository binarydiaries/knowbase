import { hideIframe } from './iframe';

export function setupMessageListener() {
  window.addEventListener('message', (event) => {
    if (!event.data || typeof event.data !== 'object') return;

    if (event.data.type === 'KB_CLOSE_CHAT') {
      hideIframe();
    }
  });
}
