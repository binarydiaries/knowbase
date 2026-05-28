import type { IEmbedConfig } from './types';

// Capture before any async — document.currentScript is null after first tick
const _scriptEl = document.currentScript as HTMLScriptElement | null;

export function getConfig(): IEmbedConfig {
  const dataAttr = _scriptEl?.dataset;
  if (dataAttr?.channelId) {
    return {
      channelId: dataAttr.channelId,
      primaryColor: dataAttr.primaryColor,
    };
  }
  return (window as any).AgenvikChat || {};
}
