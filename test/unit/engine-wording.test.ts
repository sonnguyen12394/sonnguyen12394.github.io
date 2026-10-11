import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

// v111 (SPEC.md "Game hoá mọi chức năng", luật 1): màn chơi không dùng chữ thi / đề thi / kiểm tra / bài dò / chẩn đoán / làm bài.
// Quét mọi chuỗi trong src/engine (bỏ chú thích). Chỉ phần mục tiêu kỳ thi tương lai (đang ẩn, bật ở Cài đặt → Nâng cao) và phần
// chứng chỉ tuỳ chọn được phép, liệt kê đích danh dưới đây.
const BANNED = /(?<![\p{L}\p{N}])(thi|kiểm tra|bài dò|chẩn đoán|bài kiểm tra|đề thi|làm bài)(?![\p{L}\p{N}])/iu;
const ALLOW: Array<[string, RegExp]> = [
  ['diagview.ts', /c\.future|Kỳ thi<|kỳ thi đầu tiên|tới từng kỳ thi/],   // bảng giờ học tới từng kỳ thi: chỉ khi bật mục tiêu tương lai
  ['readyview.ts', /SRC_VI|data-xr="place"|vxnew|thi thật|Nếu thi hôm nay|kỳ thi chỉ được xác nhận/],   // Readiness mục tiêu kỳ thi (tương lai)
  ['views.ts', /comm: \['Giao tiếp'|AREA_VI|c\.hidden|Ôn thi → Cách tính điểm/],                        // nhãn mục tiêu tương lai
  ['gateview.ts', /chứng chỉ|thi thật/i],   // phần chứng chỉ tuỳ chọn ở hồ sơ (chỉ người bật mới thấy), SPEC "Đề sát hạch"
];
const strip = (l: string) => l.replace(/^\s*\/\/.*$/, '').replace(/\s\/\/\s.*$/, '').replace(/\/\*.*?\*\//g, '');

test('v111 màn chơi không dùng chữ thi / kiểm tra / bài dò / chẩn đoán (trừ phần kỳ thi tương lai)', () => {
  const bad: string[] = [];
  for (const f of readdirSync('src/engine').filter(x => x.endsWith('.ts'))) {
    readFileSync(`src/engine/${f}`, 'utf8').split('\n').forEach((line, i) => {
      const code = strip(line);
      const m = code.match(BANNED);
      if (!m) return;
      if (ALLOW.some(([af, re]) => af === f && re.test(code))) return;
      bad.push(`${f}:${i + 1} "${m[0]}"`);
    });
  }
  assert.deepEqual(bad, []);
});
