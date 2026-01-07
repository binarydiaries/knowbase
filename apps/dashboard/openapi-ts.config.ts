import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'http://localhost:3000/docs/json',
  output: 'src/services',
  plugins: [
    {
      name: '@hey-api/client-axios',
      runtimeConfigPath: '@/hey-api.ts',
      throwOnError: true,
    },
  ],
});
