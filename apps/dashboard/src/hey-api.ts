import type { CreateClientConfig } from './services/client.gen';

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  withCredentials: true,
});
