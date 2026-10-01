#!/usr/bin/env node
// Máy chủ tĩnh để test (Playwright, Lighthouse): nén gzip như GitHub Pages, đúng kiểu MIME, không cache.
// Dùng: node tools/serve.mjs [cổng]   (mặc định 8088)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2] || process.env.PORT || 8088);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.css': 'text/css', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.txt': 'text/plain', '.xml': 'application/xml', '.ico': 'image/x-icon',
};
const ZIP = new Set(['.html', '.js', '.mjs', '.json', '.webmanifest', '.css', '.svg', '.txt', '.xml']);

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = normalize(join(ROOT, p));
    if (!f.startsWith(ROOT) || /[\\/](node_modules|\.git)[\\/]/.test(f)) { res.writeHead(403).end(); return; }
    const st = await stat(f);
    if (!st.isFile()) { res.writeHead(404).end(); return; }
    const ext = extname(f), body = await readFile(f);
    const h = { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' };
    if (ZIP.has(ext) && /gzip/.test(req.headers['accept-encoding'] || '')) {
      res.writeHead(200, { ...h, 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' }).end(gzipSync(body));
    } else res.writeHead(200, h).end(body);
  } catch { res.writeHead(404).end(); }
}).listen(PORT, () => console.log(`serve: http://localhost:${PORT}/`));
