import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  noExternal: [/(.*)/],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true
});
