/// <reference types="astro/client" />

declare global {
  interface Window {
    amplitude?: typeof import('@amplitude/unified');
  }
}

export {};
