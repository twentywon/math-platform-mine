import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const result = await build({
  absWorkingDir: root,
  entryPoints: ['src/main.jsx'],
  outfile: 'dist/standalone.js',
  bundle: true,
  write: false,
  minify: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  define: { 'process.env.NODE_ENV': '"production"' },
  legalComments: 'inline',
});
const js = result.outputFiles.find(file => file.path.endsWith('.js'))?.text;
const css = result.outputFiles.find(file => file.path.endsWith('.css'))?.text;
if (!js || !css) throw new Error('Standalone JavaScript or CSS output is missing');
// Use a classic inline script: file:// pages cannot depend on ESM fetches.
// Escape HTML end tags so bundled text can never terminate the inline elements.
const script = js.replace(/<\/script/gi, '<\\/script');
const style = css.replace(/<\/style/gi, '<\\/style');
const template = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const html = template
  .replace('</head>', `<style>${style}</style>\n</head>`)
  .replace(/<script\s+type="module"\s+src="\/src\/main\.jsx"><\/script>/,
    () => `<script>${script}</script>`);
if (html.includes('src="/src/main.jsx"')) throw new Error('Source entry was not replaced');
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await writeFile(new URL('../dist/monoon.html', import.meta.url), html);
console.log(`Standalone HTML: dist/monoon.html (${Buffer.byteLength(html)} bytes)`);
