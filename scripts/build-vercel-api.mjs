import { build } from 'esbuild';

await build({
  entryPoints: ['src/vercel/handler.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  external: ['@google-cloud/*'],
  minify: true,
  legalComments: 'none',
  outfile: 'api/handler.js',
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
});
