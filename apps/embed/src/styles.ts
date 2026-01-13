export const launcherStyle = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #000;
  color: #fff;
  border: none;
  cursor: pointer;
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
  
  transform: scale(1);
  transition:
    transform 1000ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 1000ms ease;
`;

export const BASE_STYLE = `
   position: fixed;
    bottom: 90px;
    right: 20px;
    width: 400px;
    height: 600px;
    border: none;
    z-index: 999999;
    border-radius: 1.5rem;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.15);

  opacity: 0;
  transform: translateY(16px);
  pointer-events: none;

  transition:
    opacity 180ms ease,
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
`;
