// Đọc mọi nhóm câu trong content/exam cho các công cụ soát (blind-*, review-*): bỏ bài học dạng câu (types) và danh mục đề,
// mở rộng "phần" đề thi thử thành nhóm như src/exam/mock.ts (expandPart) — viết lại bằng JS để chạy không cần bước build.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? (f === 'types' ? [] : walk(p)) : p.endsWith('.json') ? [p] : []; });

export function loadGroups(dir) {
  const out = [];
  for (const f of walk(dir).sort()) for (const g of [JSON.parse(readFileSync(f, 'utf8'))].flat()) {
    if (g && Array.isArray(g.sets)) g.sets.forEach((s, i) => { const { sets, ...p } = g; void sets; out.push({ ...p, ...s, id: g.sets.length > 1 ? `${g.id}-${'abcdefgh'[i]}` : g.id, part: g.id, mode: 'mock' }); });
    else if (g && Array.isArray(g.items)) out.push(g);
  }
  return out;
}

// Phương án của một câu: riêng của câu hoặc dùng chung của nhóm (TRUE/FALSE/NOT GIVEN, danh sách tiêu đề…).
export const optsOf = (it, g) => it.opts ?? g.options ?? [];
