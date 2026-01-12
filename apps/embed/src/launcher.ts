import { toggleIframe } from './iframe';
import { launcherStyle } from './styles';

export function createLauncher(chatUrl: string) {
  const btn = document.createElement('button');
  btn.innerText = '💬';
  btn.style.cssText = launcherStyle;
  btn.onclick = () => toggleIframe(chatUrl);
  document.body.appendChild(btn);
}
