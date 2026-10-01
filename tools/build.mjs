#!/usr/bin/env node
// Build của English Ladder. Kết quả vẫn là web tĩnh (GitHub Pages), được commit cùng mã nguồn:
//   1. src/exam/main.ts → x/exam.<băm>.js (esbuild, ES module, nén);
//   2. ghi tên tệp đó vào app.js (const EXAM_JS) để app nạp đúng bản;
//   3. đồng bộ số bản phát hành (APP_VERSION trong app.js) sang sw.js (VERSION, CORE) và index.html (?v=).
// CI chạy `npm run fresh`: build lại rồi kiểm không có khác biệt, nên tệp đã commit luôn khớp mã nguồn.
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, unlinkSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const P = f => join(ROOT, f);
const hash = buf => createHash('sha256').update(buf).digest('hex').slice(0, 10);

function setLine(file, re, line) {
  const s = readFileSync(P(file), 'utf8');
  if (!re.test(s)) throw new Error(`${file}: không thấy ${re}`);
  const out = s.replace(re, () => line);
  if (out !== s) writeFileSync(P(file), out);
}

// 1. Mô-đun ôn thi
const r = await build({
  entryPoints: [P('src/exam/main.ts')], bundle: true, format: 'esm', target: 'es2020',
  minify: true, write: false, legalComments: 'none', charset: 'utf8', logLevel: 'warning',
});
const code = r.outputFiles[0].contents;
const examName = `x/exam.${hash(code)}.js`;
mkdirSync(P('x'), { recursive: true });
for (const f of readdirSync(P('x'))) if (/^exam\.[0-9a-f]{10}\.js$/.test(f) && `x/${f}` !== examName) unlinkSync(P('x/' + f));
if (!existsSync(P(examName)) || !readFileSync(P(examName)).equals(Buffer.from(code))) writeFileSync(P(examName), code);

// 2. app.js biết tên tệp
setLine('app.js', /^const EXAM_JS = .*$/m, `const EXAM_JS = '${examName}';   // tools/build.mjs ghi`);

// 3. Số bản phát hành
const app = readFileSync(P('app.js'), 'utf8');
const ver = Number((/APP_VERSION = (\d+)/.exec(app) || [])[1]);
if (!ver) throw new Error('không đọc được APP_VERSION');
setLine('sw.js', /^const VERSION = .*$/m, `const VERSION = 'vl-v${ver}';`);
setLine('sw.js', /^const CORE = .*$/m, `const CORE = ['./', 'index.html', 'app.js?v=${ver}', '${examName}', 'manifest.webmanifest', 'privacy.html', 'icons/icon-192.png', 'icons/icon-512.png'];`);
setLine('index.html', /<script src="app\.js\?v=\d+"( defer)?><\/script>/, `<script src="app.js?v=${ver}" defer></script>`);

console.log(`build: ${examName} (${(code.length / 1024).toFixed(1)} KB), bản ${ver}`);
