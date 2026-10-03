// Mọi kết nối mạng của phần ôn thi đi qua đây, và chỉ chạy khi người học đã đồng ý chia sẻ thống kê ẩn danh
// (riêng đọc thống kê công khai của câu hỏi và danh sách câu tạm ẩn thì không gửi gì về người học, nên luôn được đọc).
// Không gửi tên, mã máy, mã đồng bộ hay tiến độ: chỉ id câu và đúng/sai của một lượt làm bài, hoặc cặp ước tính–điểm thật.

import type { Host } from './host.ts';
import type { XState } from './state.ts';
import type { ExamId } from './scales.ts';
import { shouldHide, type ItemStat } from './stats.ts';

export const APP_V = 49;
const CACHE_KEY = 'el-x-net';
const TTL = 12 * 3600e3;

interface NetCache {
  at: number;
  stats: Record<string, ItemStat>;
  hot: string[];
  pairs: PairStat[];
}

export interface PairStat {
  exam: ExamId;
  skill: 'L' | 'R' | 'W' | 'S';
  n: number;
  within_half: number;
  within_one: number;
  mean_err: number;
}

function readCache(): NetCache | null {
  try { const c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); return c && typeof c.at === 'number' ? c : null; } catch { return null; }
}
function writeCache(c: NetCache): void { try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch { /* bộ nhớ đầy: bỏ qua */ } }

let mem: NetCache | null = null;
let busy = false;

// Câu bị ẩn: độ phân biệt kém (≥ 50 lượt) hoặc bị báo lỗi nhiều.
export function hiddenItems(): Set<string> {
  const c = mem ?? (mem = readCache());
  if (!c) return new Set();
  const out = new Set(c.hot);
  for (const [id, s] of Object.entries(c.stats)) if (shouldHide(s)) out.add(id);
  return out;
}

export function itemStat(id: string): ItemStat | undefined { return (mem ?? (mem = readCache()))?.stats[id]; }
export function pairStats(): PairStat[] { return (mem ?? (mem = readCache()))?.pairs ?? []; }
export function netAge(): number | null { const c = mem ?? (mem = readCache()); return c ? Date.now() - c.at : null; }

// Tải thống kê công khai (tối đa 2 lần/ngày). Lỗi mạng thì giữ bản cũ, không làm gì thêm.
export async function refresh(host: Host, force = false): Promise<boolean> {
  const c = mem ?? (mem = readCache());
  if (busy || !host.online() || (!force && c && Date.now() - c.at < TTL)) return false;
  busy = true;
  try {
    const [stats, hot, pairs] = await Promise.all([
      host.rpc('el_item_stats', {}) as Promise<Array<{ item: string; n: number; p: number; rpb: number | null }>>,
      host.rpc('el_flag_hot', { min_n: 3 }) as Promise<Array<{ ref: string; n: number }>>,
      host.rpc('el_pair_stats', {}) as Promise<PairStat[]>,
    ]);
    mem = {
      at: Date.now(),
      stats: Object.fromEntries((stats || []).map(s => [s.item, { n: s.n, p: s.p, rpb: s.rpb }])),
      hot: (hot || []).map(h => h.ref),
      pairs: pairs || [],
    };
    writeCache(mem);
    return true;
  } catch { return false; } finally { busy = false; }
}

export const canShare = (x: XState): boolean => x.share;

// Gửi một lượt làm bài (chỉ khi đã đồng ý). Không chặn người học nếu lỗi mạng.
export async function sendAttempt(host: Host, x: XState, exam: ExamId, kind: 'place' | 'set' | 'mock', items: Record<string, 0 | 1>): Promise<void> {
  if (!canShare(x) || !host.online() || !Object.keys(items).length) return;
  try { const ok = await host.rpc('el_resp_post', { exam, kind, items, v: APP_V }); if (ok) { x.sent++; host.save(); } } catch { /* thử lại không cần thiết */ }
}

export async function sendPairs(host: Host, x: XState, exam: ExamId, pairs: Array<{ skill: 'L' | 'R' | 'W' | 'S'; est: number; real: number }>): Promise<boolean> {
  if (!canShare(x) || !pairs.length) return false;
  try { const n = await host.rpc('el_pair_post', { exam, pairs, v: APP_V }); if (typeof n === 'number' && n > 0) { x.sent++; host.save(); return true; } } catch { /* ghi trên máy vẫn còn */ }
  return false;
}
