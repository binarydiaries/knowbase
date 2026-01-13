import { iframeStyle } from './styles';

let iframe: HTMLIFrameElement | null = null;

export function toggleIframe(url: string) {
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.cssText = iframeStyle;
    document.body.appendChild(iframe);
  } else {
    iframe.style.display = iframe.style.display === 'none' ? 'block' : 'none';
  }
}

export function hideIframe() {
  if (!iframe) return;
  iframe.style.display = 'none';
}
