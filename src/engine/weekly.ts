// v98 Sự kiện tuần (M10 lý do quay lại, GAME-CRITERIA §10.10): mỗi tuần một chủ đề xoay vòng cho ba game chủ lực, thanh tiến độ 3 mốc,
// thưởng xu và một huy hiệu tuần vào bộ sưu tập. Thuần telemetry: không ghi bằng chứng, không đổi câu hỏi hay lộ trình (P13, P14, C69).

export type WkKind = 'word' | 'sentence' | 'star' | 'play';
export interface WkTheme { id: string; kind: WkKind; ico: string; vi: string; desc: string; goal: number }
export const THEMES: WkTheme[] = [
  { id: 'tho-mo', kind: 'word', ico: '⛏️', vi: 'Tuần thợ mỏ chữ', desc: 'Tìm từ ở Vòng Chữ và Mỏ Chữ', goal: 60 },
  { id: 'cau-chuan', kind: 'sentence', ico: '🃏', vi: 'Tuần câu chuẩn', desc: 'Ra bài đúng ở Bài Câu', goal: 24 },
  { id: 'ngoi-sao', kind: 'star', ico: '⭐', vi: 'Tuần ngôi sao', desc: 'Gom sao ở các màn và bàn thắng', goal: 30 },
  { id: 'ba-game', kind: 'play', ico: '🎪', vi: 'Tuần hội chợ', desc: 'Chơi xong màn / ván, đủ cả ba game chủ lực', goal: 9 },
];
export const TIERS = [1 / 3, 2 / 3, 1] as const;
export const TIER_COINS = [15, 30, 60] as const;

// Tuần bắt đầu thứ Hai: ngày 0 (1/1/1970) là thứ Năm.
export const weekOf = (day: number): number => Math.floor((day + 3) / 7);
export const themeOf = (week: number): WkTheme => THEMES[((week % THEMES.length) + THEMES.length) % THEMES.length]!;
export const daysLeft = (day: number): number => 7 - ((day + 3) % 7);

export interface WeekSave { week: number; prog: number; tiers: number; games: string[]; badges: string[] }
export const freshWeek = (week: number): WeekSave => ({ week, prog: 0, tiers: 0, games: [], badges: [] });

// Cộng tiến độ; trả về các mốc vừa đạt (chỉ số 0–2). Sang tuần mới thì xoá tiến độ, giữ huy hiệu.
export function wkAdd(s: WeekSave, day: number, kind: WkKind, n: number, game: string): number[] {
  const w = weekOf(day);
  if (s.week !== w) { s.week = w; s.prog = 0; s.tiers = 0; s.games = []; }
  const t = themeOf(w);
  if (game && !s.games.includes(game)) s.games.push(game);
  if (t.kind !== kind || n <= 0) return [];
  s.prog = Math.min(t.goal, s.prog + n);
  const out: number[] = [];
  for (let k = s.tiers; k < TIERS.length; k++) {
    const need = Math.ceil(t.goal * TIERS[k]!);
    if (s.prog < need) break;
    if (k === TIERS.length - 1 && t.kind === 'play' && s.games.length < 3) break;   // hội chợ: mốc cuối cần đủ ba game
    out.push(k); s.tiers = k + 1;
    if (k === TIERS.length - 1 && !s.badges.includes(`${w}:${t.id}`)) s.badges.push(`${w}:${t.id}`);
  }
  return out;
}

export function sanitizeWeek(raw: unknown): WeekSave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = raw as Record<string, unknown>, n = (v: unknown, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : 0);
  const strs = (v: unknown, max: number) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string' && s.length <= 40).slice(-max) : []);
  return { week: n(x.week, 1e6), prog: n(x.prog, 1e4), tiers: n(x.tiers, TIERS.length), games: strs(x.games, 8), badges: strs(x.badges, 520) };
}
export function mergeWeek(a?: WeekSave, b?: WeekSave): WeekSave | undefined {
  if (!a) return b; if (!b) return a;
  const cur = a.week === b.week ? (a.prog >= b.prog ? a : b) : a.week > b.week ? a : b;
  return { ...cur, games: [...new Set([...(a.week === cur.week ? a.games : []), ...(b.week === cur.week ? b.games : [])])], badges: [...new Set([...a.badges, ...b.badges])].sort() };
}

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
// Thẻ sảnh: chủ đề, thanh 3 mốc, số ngày còn lại, kệ huy hiệu.
export function viewWeekly(s: WeekSave | undefined, day: number): string {
  const w = weekOf(day), t = themeOf(w), cur = s && s.week === w ? s : freshWeek(w), pct = Math.round((cur.prog / t.goal) * 100);
  const marks = TIERS.map((f, k) => `<span class="wkmark${cur.tiers > k ? ' on' : ''}" style="left:${Math.round(f * 100)}%" aria-hidden="true">${cur.tiers > k ? '✓' : `+${TIER_COINS[k]}`}</span>`).join('');
  const badges = (s?.badges ?? []).slice(-12).map(b => { const th = THEMES.find(x => x.id === b.split(':')[1]); return `<span class="wkbadge" title="${esc(th?.vi ?? '')}">${th?.ico ?? '🏅'}</span>`; }).join('');
  return `<section class="wkcard" aria-label="Sự kiện tuần">
    <div class="spread"><b>${t.ico} ${esc(t.vi)}</b><span class="hint">còn ${daysLeft(day)} ngày</span></div>
    <p class="hint" style="margin:4px 0 8px">${esc(t.desc)}: <b>${cur.prog}/${t.goal}</b>${t.kind === 'play' ? ` · đã chơi ${cur.games.length}/3 game` : ''}. Đủ mốc cuối được huy hiệu tuần.</p>
    <div class="wkbar" role="progressbar" aria-label="Tiến độ sự kiện tuần" aria-valuemin="0" aria-valuemax="${t.goal}" aria-valuenow="${cur.prog}"><i style="width:${pct}%"></i>${marks}</div>
    ${badges ? `<p class="hint" style="margin:8px 0 0">Huy hiệu: ${badges}</p>` : ''}
  </section>`;
}
