import { BASE_STYLE } from './styles';

let iframe: HTMLIFrameElement | null = null;
let isLoading = false;
let isReady = false;
let isVisible = false;

export function openIframe(
  chatUrl: string,
  onLoading: () => void,
  onReady: () => void,
) {
  if (isReady && iframe) {
    showIframe();
    return;
  }

  if (isLoading) return;

  isLoading = true;
  onLoading();

  iframe = document.createElement('iframe');
  iframe.src = chatUrl;
  iframe.style.cssText = BASE_STYLE;

  iframe.onload = () => {
    isLoading = false;
    isReady = true;
    onReady();
    showIframe();
  };

  document.body.appendChild(iframe);
}

export function hideIframe() {
  if (!iframe) return;

  iframe.style.opacity = '0';
  iframe.style.transform = 'translateY(16px)';
  iframe.style.pointerEvents = 'none';
  isVisible = false;
}

export function isIframeVisible(): boolean {
  return isVisible;
}

function showIframe() {
  if (!iframe) return;

  requestAnimationFrame(() => {
    iframe!.style.opacity = '1';
    iframe!.style.transform = 'translateY(0)';
    iframe!.style.pointerEvents = 'auto';
    isVisible = true;
  });
}
