import { hideIframe, isIframeVisible, openIframe } from './iframe';
import { showIcon, showSpinner } from './spinner';
import { launcherStyle } from './styles';

export function createLauncher(chatUrl: string) {
  const btn = document.createElement('button');
  btn.innerHTML = '💬';
  btn.style.cssText = launcherStyle;

  // Hover enlarge
  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'scale(1.08)';
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'scale(1)';
  });

  // Press feedback
  btn.addEventListener('mousedown', () => {
    btn.style.transform = 'scale(0.95)';
  });

  btn.addEventListener('mouseup', () => {
    btn.style.transform = 'scale(1.08)';
  });

  btn.onclick = () => {
    if (isIframeVisible()) {
      hideIframe();
    } else {
      openIframe(
        chatUrl,
        () => showSpinner(btn), // loading
        () => showIcon(btn), // ready
      );
    }
  };

  document.body.appendChild(btn);
}
