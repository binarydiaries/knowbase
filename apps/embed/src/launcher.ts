import { hideIframe, isIframeVisible, openIframe } from './iframe';
import { showIcon, showSpinner } from './spinner';
import { launcherStyle } from './styles';

export function createLauncher(chatUrl: string) {
  const btn = document.createElement('button');
  btn.innerHTML = '💬';
  btn.style.cssText = launcherStyle;

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
