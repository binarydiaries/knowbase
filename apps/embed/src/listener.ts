import { hideIframe } from './iframe';
import { updateBubbleColor } from './launcher';

export function setupMessageListener() {
  window.addEventListener('message', (event) => {
    if (!event.data || typeof event.data !== 'object') return;

    if (event.data.type === 'KB_CLOSE_CHAT') {
      hideIframe();
    }

    if (event.data.type === 'KB_BUBBLE_COLOR' && typeof event.data.color === 'string') {
      updateBubbleColor(event.data.color);
    }
  });
}
