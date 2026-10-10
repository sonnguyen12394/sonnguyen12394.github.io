// Bộ não chọn game (v88). Nội dung trong mọi game đã do engine chọn (floorBase / NBA); phần còn thiếu là chọn DẠNG game hợp với nhu cầu
// học lúc này, thay vì để người học tự chọn trong 15 thẻ. direct() đọc nhu cầu (ôn sắp quên, cây đến ngày tưới, loại nút đầu lộ trình,
// điểm nghẽn, Can-Do kỹ năng còn thiếu, xếp lớp) → xếp hạng game kèm lý do nói đúng nhu cầu (không nói điểm game, P13).
// Đổi dạng (interleaving): game vừa chơi bị trừ mạnh, game đã chơi hôm nay bị trừ. planDay() chốt 3 chặng mỗi ngày, mỗi chặng một nhu cầu.
// Thuần hàm: dữ liệu vào do main.ts gom.

export type GameId = 'wheel' | 'hunt' | 'tower' | 'blocks' | 'board' | 'cards' | 'cafe' | 'bubbles' | 'puzzle' | 'case' | 'radio' | 'kara' | 'shop' | 'letter' | 'robot' | 'fog' | 'garden';
export const GAMES: Record<GameId, { start: string; ico: string; vi: string }> = {
  wheel: { start: 'whstart', ico: '🎡', vi: 'Vòng Chữ' },
  hunt: { start: 'hnstart', ico: '⛏️', vi: 'Mỏ Chữ' },
  fog: { start: 'fgstart', ico: '🗺️', vi: 'Thám hiểm sương mù' },
  garden: { start: 'gdstart', ico: '🌱', vi: 'Vườn từ' },
  blocks: { start: 'bkstart', ico: '🧱', vi: 'Xếp Khối Chữ' },
  puzzle: { start: 'pzstart', ico: '📅', vi: 'Câu đố ngày' },
  cards: { start: 'cdstart', ico: '🃏', vi: 'Bài Câu' },
  shop: { start: 'wsstart', ico: '🛠️', vi: 'Xưởng sửa câu' },
  letter: { start: 'ltstart', ico: '✉️', vi: 'Thư gửi cư dân phố' },
  case: { start: 'dtstart', ico: '🔍', vi: 'Thám tử' },
  radio: { start: 'rdstart', ico: '📻', vi: 'Đài phát thanh' },
  cafe: { start: 'cfstart', ico: '☕', vi: 'Quán Cà Phê' },
  bubbles: { start: 'bbstart', ico: '🎯', vi: 'Bắt Âm' },
  kara: { start: 'krstart', ico: '🎤', vi: 'Karaoke hội thoại' },
  robot: { start: 'rbstart', ico: '🤖', vi: 'Ra lệnh cho robot' },
  board: { start: 'bdstart', ico: '🎲', vi: 'Bàn Cờ Phố' },
  tower: { start: 'qstart', ico: '🏰', vi: 'Leo tháp' },
};
export const isGame = (x: string): x is GameId => Object.prototype.hasOwnProperty.call(GAMES, x);

export type Need = 'place' | 'water' | 'review' | 'vocab' | 'grammar' | 'func' | 'sound' | 'read' | 'listen' | 'write' | 'speak' | 'check' | 'replace' | 'fun';
export interface DirIn {
  placed: boolean;                 // đã có kết quả xếp lớp (chẩn đoán hoặc thám hiểm)
  fogWait: number;                 // còn bao nhiêu ngày mới được thám hiểm lại (≤ 0: được)
  claims: number;                  // số phần "tạm Đạt" (suy ra) chưa có bằng chứng thật
  top: { kind: string; node: string; vi: string } | null;   // bước tiếp theo của NBA
  review: number;                  // số phần sắp quên
  first: Partial<Record<'u' | 'g' | 'fn' | 'ph', string>>;  // tên phần mở đầu tiên của từng loại nút trên lộ trình
  neck: { node: string; vi: string } | null;
  gWrong: boolean;                 // phần ngữ pháp đầu lộ trình đang sai nhiều / có lỗi hiểu sai
  fnSeen: boolean;                 // phần giao tiếp đầu lộ trình đã luyện (có bằng chứng)
  cd: Partial<Record<'R' | 'L' | 'W' | 'S', { vi: string; gap: number }>>;   // Can-Do còn thiếu ở cấp đang học (gap 0–1)
  lv: string;
  garden: number;                  // số cây đến ngày tưới hôm nay
  puzzleToday: boolean;            // câu đố hôm nay đã giải
  played: string[];                // game đã chơi xong hôm nay
  last: string;                    // game vừa bắt đầu gần nhất
  tts: boolean; asr: boolean;
  recent?: Partial<Record<'u' | 'g' | 'fn' | 'ph', number>>;   // số câu trả lời 7 ngày qua theo loại nút (cân đối các mảng nền)
  acc?: number | null;             // tỉ lệ đúng gần đây (24 câu tự lực)
  flag?: 'wheel' | 'hunt' | '';    // v96: game chủ lực chơi gần nhất (qua nhiều ngày): game kia được ưu tiên để hai game thay nhau
}
export interface DirPick { game: GameId; need: Need; why: string; score: number }

const NEED_VI: Record<Need, string> = { place: 'xếp lớp', water: 'tưới từ', review: 'ôn', vocab: 'từ mới', grammar: 'ngữ pháp', func: 'giao tiếp', sound: 'âm', read: 'đọc', listen: 'nghe', write: 'viết', speak: 'nói', check: 'kiểm tra', replace: 'xếp lớp lại', fun: 'chơi thêm' };
export const needVi = (n: Need): string => NEED_VI[n];

// Mọi ứng viên (game, nhu cầu, điểm gốc, lý do). Một game có thể phục vụ nhiều nhu cầu: giữ nhu cầu điểm cao nhất.
function needs(x: DirIn): DirPick[] {
  const out: DirPick[] = [], add = (game: GameId, need: Need, score: number, why: string) => out.push({ game, need, score, why });
  const top = x.top, k = top?.node.split(':')[0] ?? '';
  // v96: lộ trình xếp với played / last rỗng nên phạt xen kẽ không chạm tới; vì vậy hai game chủ lực đổi thứ hạng theo game chơi gần nhất.
  const [fa, fb] = x.flag === 'wheel' ? ['hunt', 'wheel'] as const : ['wheel', 'hunt'] as const;
  if (!x.placed) add('fog', 'place', 100, 'App chưa biết bạn đang ở cấp nào. Thám hiểm một lần để lộ trình bỏ qua thứ bạn đã biết.');
  if (x.garden > 0) add('garden', 'water', 92, `${x.garden} từ đến ngày tưới hôm nay: ôn đúng ngày thì nhớ lâu, để lỡ thì chậm nhớ.`);
  // Ôn: chỉ đứng đầu khi NBA chọn ôn hoặc nhiều phần sắp quên (≥ 8; ≥ 12 khi đang đúng nhiều). Bot L03 (B2): ngưỡng 5 làm người học khá ôn quá nhiều phần đã vững.
  const revMin = (x.acc ?? 0) >= 0.85 ? 12 : 8;   // người đang đúng nhiều: phần "sắp quên" thường vẫn nhớ → ngưỡng cao hơn
  if (x.review >= revMin || top?.kind === 'review') {
    const n = Math.max(1, x.review);
    // v93: Vòng Chữ (game chủ lực, GAME-CRITERIA §10) đứng đầu cho ôn từ; Xếp Khối còn làm lựa chọn ôn tổng hợp.
    const rv = { wheel: `${n} phần bạn đã học đang sắp quên: vuốt chữ tìm lại từ trước khi học mới.`, hunt: `${n} phần bạn đã học đang sắp quên: đào lại từ trong mỏ chữ.` };
    add(fa, 'review', 88, rv[fa]); add(fb, 'review', 86, rv[fb]);
    add('blocks', 'review', 70, `${n} phần bạn đã học đang sắp quên: ôn ngay trước khi học mới.`);
    if (!x.puzzleToday) add('puzzle', 'review', 84, `${n} phần sắp quên: câu đố hôm nay nhắc lại từ theo nhóm chủ đề.`);
  } else if (x.review > 0) { add(fa, 'review', 55, `${x.review} phần sắp quên: ôn nhẹ.`); add(fb, 'review', 54, `${x.review} phần sắp quên: ôn nhẹ.`); }
  if (top && top.kind === 'learn') {
    if (k === 'u') { add('garden', 'vocab', 78, `Từ mới cần cho mục tiêu: ${top.vi}.`); add('wheel', 'vocab', 72, `Từ cần cho mục tiêu: ${top.vi}. Vuốt chữ để nhớ mặt chữ.`); add('hunt', 'vocab', 73, `Từ cần cho mục tiêu: ${top.vi}. Đào từ trong mỏ chữ.`); }
    if (k === 'g') add(x.gWrong ? 'shop' : 'cards', 'grammar', 80, `Ngữ pháp đang học: ${top.vi}${x.gWrong ? ' (bạn còn sai phần này: sửa câu sai để hiểu chỗ sai)' : ''}.`);
    if (k === 'fn') add(x.asr && x.fnSeen ? 'kara' : 'cafe', 'func', 80, `Giao tiếp đang học: ${top.vi}.`);
    if (k === 'ph') add('bubbles', 'sound', 80, `Âm đang học: ${top.vi}.`);
    if (k === 'cd') add('tower', 'check', 60, `Phần đang học: ${top.vi}.`);
  }
  if (top && (top.kind === 'probe' || top.kind === 'verify' || top.kind === 'transfer')) add('tower', 'check', 74, `Kiểm tra xem bạn biết thật “${top.vi}” chưa (câu mới, chưa gặp).`);
  // Điểm nghẽn = phần yếu đang chặn nhiều năng lực: ưu tiên ngay sau ôn / tưới, trên bước học mới. Bot L02: để dưới bước học thì người chơi
  // 2–3 game / ngày không bao giờ tới lượt điểm nghẽn (phần nghe tụt từ 56% xuống 22% số câu).
  if (x.neck?.node.startsWith('ph:')) add('bubbles', 'sound', 86, `Điểm nghẽn của bạn: ${x.neck.vi}. Nghe phân biệt âm để gỡ.`);
  else if (x.neck?.node.startsWith('g:')) add(x.gWrong ? 'shop' : 'cards', 'grammar', 84, `Điểm nghẽn của bạn: ${x.neck.vi}.`);
  else if (x.neck?.node.startsWith('u:')) add('blocks', 'vocab', 82, `Điểm nghẽn của bạn: ${x.neck.vi}.`);
  // Phần nền còn mở trên lộ trình (không phải bước đầu): điểm thấp hơn, để lộ trình ngày phủ nhiều mặt.
  // Mảng nền còn trên lộ trình mà 7 ngày qua gần như không luyện (< 10% số câu): +22 điểm. Bot L02: không có câu âm thì không có bằng chứng,
  // nên điểm nghẽn âm không bao giờ lộ ra (câu về âm 56 → 21 khi chỉ theo bước học mới).
  const tot = Object.values(x.recent ?? {}).reduce((a, b) => a + (b ?? 0), 0), under = (k: 'u' | 'g' | 'fn' | 'ph') => (x.recent && tot >= 20 && (x.recent[k] ?? 0) / tot < 0.1 ? 22 : 0);
  const lag = (k: 'u' | 'g' | 'fn' | 'ph') => (under(k) ? ' Mấy ngày nay bạn ít luyện phần này.' : '');
  if (x.first.u) add('garden', 'vocab', 58 + under('u'), `Từ mới cần cho mục tiêu: ${x.first.u}.${lag('u')}`);
  if (x.first.g) add(x.gWrong ? 'shop' : 'cards', 'grammar', 60 + under('g'), `Ngữ pháp cần cho mục tiêu: ${x.first.g}.${lag('g')}`);
  if (x.first.fn) add('cafe', 'func', 57 + under('fn'), `Giao tiếp cần cho mục tiêu: ${x.first.fn}.${lag('fn')}`);
  if (x.first.ph) add('bubbles', 'sound', 56 + under('ph'), `Âm cần cho mục tiêu: ${x.first.ph}.${lag('ph')}`);
  // Kỹ năng (Can-Do) còn thiếu ở cấp đang học.
  const cd = (s: 'R' | 'L' | 'W' | 'S') => x.cd[s], g = (s: 'R' | 'L' | 'W' | 'S') => 50 + Math.round(15 * (cd(s)?.gap ?? 0));
  if (cd('R')) add('case', 'read', g('R'), `Đọc ở cấp ${x.lv}: ${cd('R')!.vi}.`);
  if (cd('L') && x.tts) add('radio', 'listen', g('L'), `Nghe ở cấp ${x.lv}: ${cd('L')!.vi}.`);
  if (cd('W')) add('letter', 'write', g('W'), `Viết ở cấp ${x.lv}: ${cd('W')!.vi}.`);
  if (cd('S')) add(x.asr ? 'kara' : 'robot', 'speak', g('S') - 2, `Nói ở cấp ${x.lv}: ${cd('S')!.vi}.`);
  if (x.placed && x.fogWait <= 0 && x.claims >= 5) add('fog', 'replace', 62, `${x.claims} phần mới chỉ “tạm Đạt” theo suy đoán: xếp lớp lại để app biết đúng cấp của bạn.`);
  // Luôn có lựa chọn: tháp dùng mọi loại câu; Bàn Cờ / Robot để chơi thêm.
  add('tower', 'check', 40, 'Luyện tổng hợp những gì lộ trình đang cần.');
  const fun = { hunt: 'Chơi thêm: khai thác Mỏ Chữ, nhiệm vụ là từ trong lộ trình của bạn.', wheel: 'Chơi thêm: màn Vòng Chữ tiếp theo, từ trong lộ trình của bạn.' };
  add(fa, 'fun', 45, fun[fa]); add(fb, 'fun', 44, fun[fb]);
  add('board', 'fun', 22, 'Chơi thêm cho vui: mỗi ô vẫn là câu tiếng Anh app chọn cho bạn.');
  add('robot', 'fun', 20, 'Chơi thêm: gọi đúng tên đồ vật để robot nhặt.');
  if (x.tts) add('kara', 'speak', 30, 'Nói theo hội thoại cho quen miệng.');
  return out;
}

// Xếp hạng: mỗi game giữ nhu cầu điểm cao nhất; trừ điểm game vừa chơi (−45) và đã chơi hôm nay (−25 mỗi game; câu đố / thám hiểm chỉ một lần).
export function direct(x: DirIn): DirPick[] {
  const best = new Map<GameId, DirPick>();
  for (const p of needs(x)) {
    if (p.game === 'radio' && !x.tts) continue;
    if (p.game === 'puzzle' && x.puzzleToday) continue;
    if (p.game === 'fog' && x.placed && x.fogWait > 0) continue;
    if (p.game === 'garden' && p.need === 'vocab' && x.played.includes('garden') && x.garden === 0) continue;   // đã gieo hôm nay: mai tưới
    const cur = best.get(p.game);
    if (!cur || p.score > cur.score) best.set(p.game, p);
  }
  const out = [...best.values()].map(p => {
    let s = p.score;
    if (p.game === x.last) s -= 45;
    if (x.played.includes(p.game)) s -= 25;
    return { ...p, score: s };
  });
  return out.sort((a, b) => b.score - a.score || (a.game < b.game ? -1 : 1));
}

// Lộ trình hôm nay: 3 game đầu bảng, mỗi game một nhu cầu khác nhau (chơi thêm không vào lộ trình), tối đa MỘT chặng kỹ năng (đọc / nghe /
// viết / nói): người mới có mọi Can-Do còn thiếu nên kỹ năng dễ chiếm hết lộ trình, trong khi từ / ngữ pháp nền mới là thứ mở đường. Ôn / tưới trước.
export const PLAN_N = 3;
const SKILL = new Set<Need>(['read', 'listen', 'write', 'speak']);
const ORDER: Need[] = ['place', 'water', 'review', 'check', 'grammar', 'vocab', 'func', 'sound', 'read', 'listen', 'write', 'speak', 'replace', 'fun'];
export function planDay(x: DirIn): DirPick[] {
  const seen = new Set<Need>(), out: DirPick[] = [];
  for (const p of direct({ ...x, played: [], last: '' })) {
    if (out.length >= PLAN_N) break;
    if (p.need === 'fun' || seen.has(p.need) || (SKILL.has(p.need) && out.some(q => SKILL.has(q.need)))) continue;
    seen.add(p.need); out.push(p);
  }
  return out.sort((a, b) => ORDER.indexOf(a.need) - ORDER.indexOf(b.need));
}

// Game chơi tiếp: chặng đầu tiên của lộ trình hôm nay chưa chơi xong (trừ game vừa chơi, nếu còn chặng khác); hết lộ trình → đầu bảng direct().
export function nextGame(x: DirIn, plan: DirPick[]): { pick: DirPick; inPlan: boolean } {
  const left = plan.filter(p => !x.played.includes(p.game));
  const p = left.find(q => q.game !== x.last) ?? left[0];
  if (p) {
    const fresh = direct(x).find(q => q.game === p.game);   // lý do theo số liệu lúc này (vd. số mục sắp quên đã đổi)
    return { pick: fresh ?? p, inPlan: true };
  }
  return { pick: direct(x)[0]!, inPlan: false };
}

// Lưu: lộ trình hôm nay (giữ nguyên trong ngày), game đã chơi xong hôm nay, game vừa bắt đầu.
export interface DirSave { day: number; plan: Array<{ game: string; need: string; why: string }>; done: string[]; last: string; runs: number }
export const freshDirSave = (): DirSave => ({ day: 0, plan: [], done: [], last: '', runs: 0 });
const NEEDS = new Set<string>(ORDER);
export function sanitizeDir(raw: unknown): DirSave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = raw as Record<string, unknown>, n = (v: unknown, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : 0);
  const games = (v: unknown) => (Array.isArray(v) ? [...new Set(v.filter((g): g is string => typeof g === 'string' && isGame(g)))].slice(0, 20) : []);
  const plan = Array.isArray(x.plan) ? x.plan.flatMap(p => {
    const q = p as Record<string, unknown> | null;
    return q && typeof q.game === 'string' && isGame(q.game) && typeof q.need === 'string' && NEEDS.has(q.need) ? [{ game: q.game, need: q.need, why: typeof q.why === 'string' ? q.why.slice(0, 300) : '' }] : [];
  }).slice(0, PLAN_N) : [];
  return { day: n(x.day, 1e6), plan, done: games(x.done), last: typeof x.last === 'string' && isGame(x.last) ? x.last : '', runs: n(x.runs, 1e7) };
}
// Gộp hai máy: ngày mới hơn thắng; cùng ngày thì gộp game đã chơi.
export function mergeDir(a?: DirSave, b?: DirSave): DirSave | undefined {
  if (!a) return b; if (!b) return a;
  if (a.day !== b.day) { const w = a.day > b.day ? a : b; return { ...w, runs: Math.max(a.runs, b.runs) }; }
  return { day: a.day, plan: a.plan.length ? a.plan : b.plan, done: [...new Set([...a.done, ...b.done])], last: a.last || b.last, runs: Math.max(a.runs, b.runs) };
}
