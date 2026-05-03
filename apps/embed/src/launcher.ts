import { bubbleIcon, chevronDown } from './icons';
import { hideIframe, isIframeVisible, openIframe } from './iframe';
import { launcherStyle } from './styles';

const btn = document.createElement('button');

export function createLauncher(chatUrl: string) {
  btn.style.cssText = launcherStyle;
  showButtonBrand();
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
      openIframe(chatUrl);
    }
  };

  document.body.appendChild(btn);
}

export function showButtonLoading() {
  btn.innerHTML = `
    <span style="
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      display: inline-block;
      animation: kb-spin 0.8s linear infinite;
    "></span>
  `;

  injectSpinnerKeyframes();
}

function injectSpinnerKeyframes() {
  if (document.getElementById('__kb_spinner__')) return;

  const style = document.createElement('style');
  style.id = '__kb_spinner__';
  style.textContent = `
    @keyframes kb-spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export function showButtonArrow() {
  btn.innerHTML = chevronDown;
}

export function showButtonBrand() {
  btn.innerHTML = bubbleIcon;
}

export function updateBubbleColor(color: string) {
  btn.style.background = color;
}
