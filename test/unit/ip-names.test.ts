import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

// v72: chuẩn bị phát hành trên App Store / Google Play — tệp phát hành không được mang tên thương hiệu của game khác (guideline 4.1
// Copycats). Game trong app chỉ lấy cơ chế chung của thể loại; tên, hình, âm thanh đều là của app.
const BRANDS = ['Block Blast', 'Monopoly', 'Balatro', 'Tetris', 'Candy Crush', 'Royal Match', 'Royal Kingdom', 'Gossip Harbor', 'Slay the Spire', 'Wordle', 'Subway Surfers', 'Pizza Ready', '1010!'];
const files = ['app.js', 'index.html', 'manifest.webmanifest', 'manifest.json', 'sw.js', ...readdirSync('x').map(f => `x/${f}`), ...readdirSync('src/engine').filter(f => f.endsWith('.ts')).map(f => `src/engine/${f}`)].filter(f => existsSync(f));

test('v72: tệp phát hành không chứa tên thương hiệu game khác', () => {
  for (const f of files) {
    // Phân biệt hoa thường: "monopoly" (danh từ, từ vựng tiếng Anh) hợp lệ; "Monopoly" (thương hiệu) thì không.
    const t = readFileSync(f, 'utf8');
    for (const b of BRANDS) assert.ok(!t.includes(b), `${f} chứa "${b}"`);
  }
});
