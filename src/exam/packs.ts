// Nạp gói nội dung ôn thi theo nhu cầu (yêu cầu 3.2: tải dần). Tệp có băm nội dung trong tên nên lưu lâu trong bộ nhớ đệm
// của service worker (ngăn "el-x"); gói không còn trong danh sách thì app tự dọn.

import INDEX from './gen/index.json';
import type { Group } from './content.ts';

export interface PackInfo { file: string; groups: number; items: number; qtypes: string[]; exams: string[] }
export interface Index { packs: Record<string, PackInfo>; items: Record<string, [number, number, 'L' | 'R', string]> }

export const IDX = INDEX as unknown as Index;
export const X_CACHE = 'el-x';

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
