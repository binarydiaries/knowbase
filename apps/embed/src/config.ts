import type { IEmbedConfig } from './types';

export function getConfig(): IEmbedConfig {
  return (window as any).AgenvikChat || {};
}
