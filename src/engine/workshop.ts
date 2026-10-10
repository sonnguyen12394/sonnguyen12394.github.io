// Xưởng sửa câu (v82, F3 ngữ pháp + F9 viết có kiểm soát): câu "hỏng" chạy trên băng chuyền, người chơi tự gõ lại câu đúng (mức 4,
// đoán mò = 0). Câu sai lấy từ lỗi hay gặp của chính điểm ngữ pháp engine chọn. Hộp đóng gói / sao là telemetry (P13). Không tính giờ.

import type { ECtx } from './views.ts';
import type { Challenge } from './quest.ts';
import type { FixItem } from './host.ts';

export const ORDERS = 6;   // số đơn mỗi ca
const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/[.!?]+$/g, '').replace(/\s+/g, ' ').trim();
export const accepted = (given: string, accept: string[]): boolean => accept.some(a => norm(a) === norm(given));
// Vị trí từ khác nhau giữa câu đã gõ và câu đúng (để tô đỏ / xanh khi sai).
export function diff(given: string, right: string): number[] {
  const a = norm(given).split(' '), b = norm(right).split(' '), out: number[] = [];
  for (let i = 0; i < b.length; i++) if (a[i] !== b[i]) out.push(i);
  return out;
}

// v90 Tìm chỗ hỏng (F3b nhận ra lỗi — GAME-CRITERIA §9.3): trước khi gõ, người chơi có thể chạm từ sai trong câu hỏng.
// Từ sai = từ của câu hỏng không nằm trong dãy con chung dài nhất với câu đúng. Lỗi thiếu từ (câu hỏng không có từ thừa / sai) → hai từ
// kề chỗ thiếu đều tính là đúng chỗ. Chạm đúng: không ảnh hưởng bằng chứng. Chạm sai: app chỉ ra chỗ hỏng, nên câu gõ sau đó là câu có
// gợi ý (hint, trọng số thấp hơn) — trung thực với bằng chứng (G3). Chạm là tuỳ chọn: gõ thẳng vẫn được.
const tok = (s: string) => s.split(/\s+/).filter(Boolean);
const key = (w: string) => w.toLowerCase().replace(/[’']/g, "'").replace(/^[^\w']+|[^\w']+$/g, '');
export function badSpots(bad: string, good: string): number[] {
  const a = tok(bad).map(key), b = tok(good).map(key), n = a.length, m = b.length;
  const L = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i]![j] = a[i] === b[j] ? L[i + 1]![j + 1]! + 1 : Math.max(L[i + 1]![j]!, L[i]![j + 1]!);
  const keep = new Set<number>(), gaps: number[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { keep.add(i); i++; j++; }
    else if (L[i + 1]![j]! >= L[i]![j + 1]!) i++;
    else { gaps.push(i); j++; }   // từ của câu đúng bị thiếu trước vị trí i
  }
  if (j < m) gaps.push(n);
  const out = a.map((_, k) => k).filter(k => !keep.has(k));
  if (out.length) return out;
  return [...new Set(gaps.flatMap(g => [g - 1, g]).filter(k => k >= 0 && k < n))];
}

export interface ShopSave { runs: number; packed: number; best: number; day: number }
export const freshShopSave = (): ShopSave => ({ runs: 0, packed: 0, best: 0, day: 0 });
export function sanitizeShop(raw: unknown): ShopSave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = raw as Record<string, unknown>, n = (v: unknown, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : 0);
  return { runs: n(x.runs, 1e7), packed: n(x.packed, 1e8), best: n(x.best, 100), day: n(x.day, 1e6) };
}
export function mergeShop(a?: ShopSave, b?: ShopSave): ShopSave | undefined {
  if (!a) return b; if (!b) return a;
  return { runs: Math.max(a.runs, b.runs), packed: Math.max(a.packed, b.packed), best: Math.max(a.best, b.best), day: Math.max(a.day, b.day) };
}

export interface ShopRun {
  floor: number; t0: number; k: number; n: number; ok: number; coins: number; wrong: string[]; passed?: string[]; done: boolean;
  ch: Challenge | null; node: string; item: FixItem | null; novel: boolean;
  ans: { ok: boolean; given: string; coins: number } | null;
  spot?: { i: number; ok: boolean } | null; spots?: number;   // v90: lần chạm chỗ hỏng của đơn này; số đơn tìm đúng chỗ trong ca
}

export function viewShop(c: ECtx, r: ShopRun, node: string): string {
  const esc = c.host.esc, it = r.item;
  const belt = Array.from({ length: ORDERS }, (_, k) => `<span class="wsbox${k < r.k || (k === r.k && r.ans?.ok) ? ' done' : k === r.k ? ' cur' : ''}" aria-hidden="true">${k < r.k ? '📦' : k === r.k ? (r.ans ? (r.ans.ok ? '📦' : '↩️') : '🛠️') : '▫️'}</span>`).join('');
  const head = `<section class="stack" style="gap:6px"><div class="spread"><span class="eyebrow">✍️ Xưởng sửa câu · đơn ${Math.min(r.k + 1, ORDERS)}/${ORDERS}</span><span>📦 <b>${r.ok}</b> · 🪙 ${r.coins}</span></div><div class="wsbelt">${belt}</div></section>`;
  if (!it) return `${head}<p class="muted">Chưa có câu nào để sửa cho mục tiêu này.</p><div class="row"><button class="btn primary" data-e="wsnext">Tiếp</button></div>`;
  const bad = `<div class="wsbad"><span class="hint">Câu hỏng · ${esc(node)}</span><p lang="en">${esc(it.bad)}</p></div>`;
  if (r.ans) {
    const a = r.ans, d = a.ok ? [] : diff(a.given, it.good), w = it.good.split(' ');
    const right = w.map((x, i) => (d.includes(i) ? `<b class="wsfix">${esc(x)}</b>` : esc(x))).join(' ');
    return `${head}${bad}<div class="fb ${a.ok ? 'good' : 'bad'}" role="status"><strong>${a.ok ? 'Sửa chuẩn! Đóng gói 📦' : 'Chưa đúng: hàng quay lại xưởng'}</strong>
      ${a.ok ? '' : `<span>Câu đúng: <span lang="en">${right}</span></span>${a.given ? `<span class="hint">Bạn gõ: <span lang="en">${esc(a.given)}</span></span>` : ''}`}${it.why ? `<span class="hint">💡 ${esc(it.why)}</span>` : ''}<span class="hint">+${a.coins} xu${r.novel ? ' · câu mới' : ''}</span></div>
      <div class="row"><button class="btn primary" data-e="wsnext" id="qnextbtn">${r.k + 1 >= ORDERS ? 'Hết ca' : 'Đơn kế ▸'}</button></div>`;
  }
  const sp = r.spot, right = new Set(badSpots(it.bad, it.good));
  const chips = it.bad.split(/\s+/).filter(Boolean).map((w, i) => {
    const cls = sp ? (i === sp.i ? (sp.ok ? ' ok' : ' no') : !sp.ok && right.has(i) ? ' ok' : '') : '';
    return sp ? `<span class="wsw${cls}" lang="en">${esc(w)}</span>` : `<button class="wsw" data-e="wsspot" data-i="${i}" lang="en">${esc(w)}</button>`;
  }).join(' ');
  const spotMsg = !sp ? '<p class="hint">🔍 Thợ tinh mắt: chạm vào từ hỏng trước (không bắt buộc), rồi gõ lại câu.</p>'
    : sp.ok ? '<p class="fb good" role="status" style="padding:6px 10px">🔍 Đúng chỗ hỏng! +1 xu. Giờ gõ lại câu cho đúng.</p>'
    : '<p class="fb bad" role="status" style="padding:6px 10px">🔍 Chỗ hỏng ở từ tô xanh. Gõ lại câu cho đúng (câu này tính là có gợi ý).</p>';
  const spot = right.size ? `<div class="wsspot" role="group" aria-label="Các từ của câu hỏng">${chips}</div>${spotMsg}` : '';   // lỗi chỉ ở dấu câu: không có từ để chạm
  return `${head}${bad}${spot}<p class="hint">Gõ lại cả câu cho đúng (chỉ sửa chỗ sai).</p>
    <form class="stack" data-eform="wstyped"><input class="field" name="a" autocomplete="off" autocapitalize="off" spellcheck="false" lang="en" aria-label="Câu đã sửa" value="${esc(it.bad)}"><div class="row"><button class="btn primary">🔧 Sửa xong</button><button class="btn ghost" type="button" data-e="wsskip" data-i="-1">Không biết</button></div></form>`;
}

export function viewShopEnd(c: ECtx, r: ShopRun, best: number): string {
  const esc = c.host.esc, rec = r.ok > best;
  return `<section class="stack"><span class="eyebrow">✍️ Xưởng sửa câu</span><h1>✍️ Hết ca!</h1>
    <p style="font-size:22px">📦 ${r.ok}/${r.n} câu sửa chuẩn${rec ? ' · <b>Kỷ lục mới!</b>' : ''} · +${r.coins} xu</p>
    ${r.spots ? `<p>🔍 Tìm đúng chỗ hỏng ${r.spots}/${r.n} đơn.</p>` : ''}
    ${r.passed?.length ? `<div class="fb good" role="status"><strong>⬆ Lên cấp: ${r.passed.slice(0, 4).map(esc).join(', ')}</strong><span>đã vững (từ câu bạn tự sửa, không phải từ điểm game)</span></div>` : ''}
    <p class="hint">Mỗi câu bạn tự sửa được ghi vào bản đồ năng lực (ngữ pháp mức 4). Hộp và xu chỉ để vui.</p></section>
    <div class="row"><button class="btn primary" data-e="wsstart">✍️ Ca mới</button><button class="btn ghost" data-e="qhome">Về sảnh</button></div>`;
}
