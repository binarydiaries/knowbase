export function showSpinner(btn: HTMLButtonElement) {
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

export function showIcon(btn: HTMLButtonElement) {
  btn.innerHTML = '💬';
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
