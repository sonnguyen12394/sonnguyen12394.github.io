// Nạp gói nội dung ôn thi theo nhu cầu (yêu cầu 3.2: tải dần). Tệp có băm nội dung trong tên nên lưu lâu trong bộ nhớ đệm
// của service worker (ngăn "el-x"); gói không còn trong danh sách thì app tự dọn.

import INDEX from './gen/index.json';
import type { Group } from './content.ts';
import type { MockTest } from './mock.ts';

export interface PackInfo { file: string; groups: number; items: number; qtypes: string[]; exams: string[] }
export interface MockEntry extends MockTest { n: { L: number; R: number }; dur: number }   // dur: giây âm thanh phần Nghe
export interface Index { packs: Record<string, PackInfo>; items: Record<string, [number, number, 'L' | 'R', string, string?]>; mocks: MockEntry[] }

export const IDX = INDEX as unknown as Index;
export const X_CACHE = 'el-x';

// Phiên bản nội dung của một câu (băm nội dung lúc build): đổi câu thì bằng chứng cũ vẫn truy được về bản đã làm.
export const contentVer = (id: string): string | undefined => IDX.items[id]?.[4];

export function itemParams(id: string): { b: number; g: number } | undefined {
  const r = IDX.items[id];
  return r ? { b: r[0], g: r[1] } : undefined;
}

const mem = new Map<string, Promise<Group[]>>();

export function loadPack(name: string): Promise<Group[]> {
  const info = IDX.packs[name];
  if (!info) return Promise.reject(new Error('không có gói ' + name));
  let p = mem.get(name);
  if (!p) {
    p = fetch(info.file).then(r => { if (!r.ok) throw new Error('http ' + r.status); return r.json() as Promise<Group[]>; });
    p.catch(() => mem.delete(name));
    mem.set(name, p);
  }
  return p;
}

// Gói đã có trên máy (dùng được khi mất mạng)?
export async function packCached(name: string): Promise<boolean> {
  const info = IDX.packs[name];
  if (!info || typeof caches === 'undefined') return false;
  try { return !!(await (await caches.open(X_CACHE)).match(new URL(info.file, location.href).href)); } catch { return false; }
}

// Dọn tệp nội dung cũ (bản trước) khỏi bộ nhớ đệm.
export async function cleanCache(): Promise<void> {
  if (typeof caches === 'undefined') return;
  try {
    const c = await caches.open(X_CACHE), keep = new Set(Object.values(IDX.packs).map(p => new URL(p.file, location.href).pathname));
    for (const k of await c.keys()) { const path = new URL(k.url).pathname; if (/\/data\/exam\//.test(path) && !keep.has(path)) await c.delete(k); }
  } catch { /* không có bộ nhớ đệm: bỏ qua */ }
}

// Gói chứa một câu (để nạp lại khi ôn sổ lỗi sai): kiểm tra đầu vào, đề thi thử (m-<đề>-…) hoặc gói luyện theo dạng.
export function packOfItem(id: string): string | undefined {
  const r = IDX.items[id];
  if (!r) return undefined;
  if (id.startsWith('pl-')) return 'place';
  const m = /^m-([a-z0-9]+)-/.exec(id);
  if (m) return 'm-' + m[1];
  return 'p-' + r[3];
}
