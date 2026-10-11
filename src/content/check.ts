// Kiểm tự động mọi nhóm câu hỏi trước khi phát hành (yêu cầu 8.3, 8.4). Chạy trong CI qua tools/content-check.ts.
// Mỗi lỗi kèm id nhóm/câu và lý do bằng tiếng Việt để người soạn sửa.

import { QT, sourceText, answerKind, itemOptions, type Group, type Item, type TextAnswer } from '../exam/content.ts';
import { markItem, withinLimit, norm, marksOf } from '../exam/score.ts';
import { levelOf, tokens, LEVELS } from './lemma.ts';
import { MOCK_FORMAT, testGroups, meanB, type MockTest } from '../exam/mock.ts';

export interface Issue {
  where: string;
  msg: string;
}

const VI = /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;
const squash = (s: string): string => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim().toLowerCase();

// Độ dài văn bản (số từ) theo chế độ dùng và kỹ năng. Bài đọc đề thi thử: một bài đọc IELTS 700–1000 từ, VSTEP 300–700 từ.
export const LENGTH: Record<string, Record<string, [number, number]>> = {
  reading: { place: [50, 320], practice: [150, 1000], mock: [280, 1050], gate: [50, 320] },
  listening: { place: [20, 320], practice: [120, 1100], mock: [150, 1300], gate: [20, 320] },
};
// Ngoại lệ theo dạng câu (bộ luyện): Phần 1 Nghe VSTEP là các thông báo ngắn ~30–40 từ, mỗi bộ gồm 3 đoạn.
export const QLENGTH: Record<string, [number, number]> = { 'v-l1': [60, 400] };

// Dạng có danh sách cố định (TRUE/FALSE/NOT GIVEN…) không xét thứ tự đáp án.
const ORDERLESS = new Set(['r-tfng', 'r-ynng']);

// Số câu điền nằm nguyên văn trong bài (IELTS: "Choose NO MORE THAN … WORDS from the passage").
const FROM_TEXT = new Set(['r-sentence', 'r-summary', 'r-notes', 'r-diagram', 'r-short', 'l-form', 'l-sentence', 'l-flow', 'l-short']);

export const wordCount = (s: string): number => s.trim().split(/\s+/).filter(Boolean).length;

export interface LevelReport {
  total: number;
  over: number;              // số lượt từ vượt cấp hoặc ngoài danh sách
  overWords: string[];       // các từ đó (không trùng)
  ratio: number;
}

export function levelReport(g: Group, list: Record<string, string>): LevelReport {
  const text = sourceText(g).join(' ');
  const cap = LEVELS.indexOf(g.level);
  const allow = new Set((g.allow ?? []).map(w => w.toLowerCase()));
  let total = 0, over = 0;
  const overWords = new Set<string>();
  for (const t of tokens(text)) {
    if (t.proper) continue;
    const w = t.w.toLowerCase();
    const L = levelOf(w, list);
    // Từ viết hoa không có trong danh sách (kể cả ở đầu câu, như tên người ký thư) là tên riêng.
    if (L === null && /^[A-Z]/.test(t.w)) continue;
    total++;
    if (allow.has(w)) continue;
    if (L === null || LEVELS.indexOf(L) > cap) { over++; overWords.add(w); }
  }
  return { total, over, overWords: [...overWords].sort(), ratio: total ? over / total : 0 };
}

export const MAX_OVER = 0.05;

export function checkGroup(g: Group, list: Record<string, string> | null): Issue[] {
  const out: Issue[] = [];
  const bad = (where: string, msg: string): void => { out.push({ where, msg }); };
  const qt = QT[g.qtype];
  if (!qt) bad(g.id, `dạng câu hỏi "${g.qtype}" không có trong danh mục`);
  else {
    if (!g.exams.every(e => qt.exams.includes(e))) bad(g.id, `dạng ${g.qtype} không thuộc kỳ thi ${g.exams.join(', ')}`);
    if ((qt.skill === 'R') !== (g.kind === 'reading')) bad(g.id, `dạng ${g.qtype} không khớp loại bài ${g.kind}`);
  }
  const src = sourceText(g);
  if (g.mode === 'practice' && !g.id.startsWith(g.qtype + '-')) bad(g.id, `id bộ luyện phải bắt đầu bằng id dạng câu "${g.qtype}-"`);
  if (g.kind === 'reading' && !g.paras?.length) bad(g.id, 'bài đọc thiếu nội dung (paras)');
  if (g.kind === 'listening') {
    if (!g.script?.length) bad(g.id, 'bài nghe thiếu lời thoại (script)');
    if (g.paras) bad(g.id, 'bài nghe không dùng paras');
  }
  const n = wordCount(src.join(' '));
  const [lo, hi] = (g.mode === 'practice' && QLENGTH[g.qtype]) || LENGTH[g.kind]![g.mode]!;
  // Đề thi thử: độ dài theo vị trí phần trong đề, kiểm ở checkMock.
  if (g.mode !== 'mock' && (n < lo || n > hi)) bad(g.id, `độ dài ${n} từ, chuẩn ${lo}–${hi} từ cho ${g.kind}/${g.mode}`);
  if (g.mode === 'mock' && !g.part) bad(g.id, 'nhóm đề thi thử phải thuộc một phần (part)');
  if (g.vi && g.vi.length !== src.length) bad(g.id, `bản dịch có ${g.vi.length} dòng, bài có ${src.length} dòng`);
  if (g.options) {
    const ks = g.options.map(o => o.k), ts = g.options.map(o => squash(o.t));
    if (new Set(ks).size !== ks.length) bad(g.id, 'khoá phương án dùng chung bị trùng');
    if (new Set(ts).size !== ts.length) bad(g.id, 'nội dung phương án dùng chung bị trùng');
    // Danh sách dùng chung (tiêu đề, người, phòng, khung từ) không được xếp theo thứ tự đáp án của các câu:
    // GĐ6 bản nháp xếp tiêu đề và nhà nghiên cứu đúng thứ tự trong bài, đoán theo thứ tự là trúng.
    const idx = g.items.map(it => (typeof it.ans === 'string' ? ks.indexOf(it.ans) : -1));
    if (g.mode === 'mock' && !ORDERLESS.has(g.qtype) && g.items.length >= 3 && idx.every(i => i >= 0) && idx.every((v, i) => i === 0 || v >= idx[i - 1]!))
      bad(g.id, 'đáp án các câu theo đúng thứ tự trong danh sách phương án — xáo danh sách để không đoán được theo thứ tự');
  }
  const ids = new Set<string>();
  for (const it of g.items) {
    const w = `${g.id}/${it.id}`;
    if (ids.has(it.id)) bad(w, 'id câu bị trùng trong nhóm');
    ids.add(it.id);
    checkItem(g, it, src, bad, w);
  }
  if (list) {
    const r = levelReport(g, list);
    if (r.ratio > MAX_OVER) bad(g.id, `${(r.ratio * 100).toFixed(1)}% lượt từ vượt cấp ${g.level} (tối đa 5%): ${r.overWords.slice(0, 25).join(', ')}${r.overWords.length > 25 ? '…' : ''}`);
  }
  return out;
}

function checkItem(g: Group, it: Item, src: string[], bad: (w: string, m: string) => void, w: string): void {
  const kind = answerKind(it, g), opts = itemOptions(it, g);
  if (!VI.test(it.why)) bad(w, 'giải thích "why" phải bằng tiếng Việt');
  if (it.ev.p >= src.length) bad(w, `ev.p = ${it.ev.p} vượt số đoạn/dòng (${src.length})`);
  else if (!squash(src[it.ev.p]!).includes(squash(it.ev.s))) bad(w, 'câu trích "ev.s" không nằm nguyên văn trong đoạn/dòng ev.p');
  if (kind === 'choice' || kind === 'multi') {
    if (opts.length < 2) bad(w, 'câu trắc nghiệm thiếu phương án');
    const keys = opts.map(o => o.k);
    if (it.opts) {
      if (new Set(keys).size !== keys.length) bad(w, 'khoá phương án bị trùng');
      const ts = it.opts.map(o => squash(o.t));
      if (new Set(ts).size !== ts.length) bad(w, 'hai phương án có nội dung giống nhau');
      // Câu hỏi bỏ lửng (không có "?") thì mọi phương án phải nối tiếp được câu đó: viết thường hoặc là số.
      // v42: đổi phương án mà quên câu hỏi đã sinh ra "…it may / Within one generation".
      if (!/[?:]\s*$|___/.test(it.q)) for (const o of it.opts) if (/^[A-Z]/.test(o.t) && !/^(I|[A-Z][a-z]+(?= [A-Z])|[A-Z]{2,}|[A-Z]\w*'s)\b/.test(o.t))
        bad(w, `câu hỏi bỏ lửng nhưng phương án ${o.k} viết hoa đầu câu — không nối tiếp được câu hỏi`);
    }
    const ans = kind === 'choice' ? [it.ans as string] : (it.ans as string[]);
    for (const a of ans) if (!keys.includes(a)) bad(w, `đáp án "${a}" không có trong phương án`);
    if (kind === 'choice' && ans.length !== 1) bad(w, 'câu một đáp án phải có đúng một đáp án');
    // giải thích vì sao từng phương án sai: ≤ 5 phương án thì đủ cả; danh sách dài (tiêu đề, khung từ) thì ít nhất 2 phương án nhiễu
    const wrongKeys = keys.filter(k => !ans.includes(k));
    const explained = wrongKeys.filter(k => it.wrong?.[k] && VI.test(it.wrong[k]!));
    if (keys.length <= 5 ? explained.length < wrongKeys.length : explained.length < 2)
      bad(w, `thiếu giải thích tiếng Việt vì sao phương án sai: ${wrongKeys.filter(k => !explained.includes(k)).join(', ')}`);
    for (const k of Object.keys(it.wrong ?? {})) if (!keys.includes(k) || ans.includes(k)) bad(w, `"wrong.${k}" không phải phương án sai của câu`);
    // máy chấm: đáp án đúng được trọn điểm, mỗi phương án sai bị bắt
    const full = markItem(it, g, kind === 'choice' ? (it.ans as string) : (it.ans as string[]));
    if (full.got !== marksOf(it)) bad(w, 'máy chấm không cho trọn điểm với đáp án đúng');
    for (const k of wrongKeys) if (kind === 'choice' && markItem(it, g, k).got !== 0) bad(w, `máy chấm cho điểm phương án sai ${k}`);
  } else {
    const acc = (it.ans as TextAnswer).accept;
    if (it.limit === undefined) bad(w, 'câu điền phải ghi giới hạn số từ (limit)');
    // Giới hạn trong lời dẫn (thí sinh đọc) phải khớp giới hạn máy chấm dùng.
    const m = /(?:NO MORE THAN|ONLY) (ONE|TWO|THREE|FOUR|FIVE) WORDS?( AND\/OR A NUMBER)?/.exec(g.instr);
    if (m) {
      const n = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'].indexOf(m[1]!) + 1;
      if (it.limit !== n) bad(w, `limit = ${it.limit} nhưng lời dẫn ghi ${m[1]} WORD(S)`);
      if (!!m[2] !== !!it.num) bad(w, `lời dẫn ${m[2] ? 'có' : 'không có'} "AND/OR A NUMBER" nhưng num = ${!!it.num}`);
    }
    for (const a of acc) {
      if (!withinLimit(a, it.limit, it.num)) bad(w, `đáp án chấp nhận "${a}" vượt giới hạn từ`);
      if (markItem(it, g, a).got !== 1) bad(w, `máy chấm không nhận đáp án chấp nhận "${a}"`);
    }
    const first = acc[0]!;
    for (const wrong of [first + 'x', first.slice(0, -1), 'xyz ' + first])
      if (norm(wrong) !== norm(first) && markItem(it, g, wrong).got !== 0 && !acc.some(a => norm(a) === norm(wrong))) bad(w, `máy chấm nhận nhầm câu sai "${wrong}"`);
    if (FROM_TEXT.has(g.qtype) && !acc.some(a => squash(src.join(' ')).includes(squash(a))))
      bad(w, 'đáp án điền phải có nguyên văn trong bài (ít nhất một cách viết)');
  }
  if (!(it.b >= 1 && it.b <= 9)) bad(w, 'độ khó b phải trong 1–9');
}

// Kiểm chéo cả kho: id câu duy nhất toàn cục.
export function checkAll(groups: Group[], list: Record<string, string> | null): Issue[] {
  const out: Issue[] = [];
  const gids = new Set<string>(), iids = new Map<string, string>();
  for (const g of groups) {
    if (gids.has(g.id)) out.push({ where: g.id, msg: 'id nhóm bị trùng' });
    gids.add(g.id);
    for (const it of g.items) {
      const prev = iids.get(it.id);
      if (prev) out.push({ where: `${g.id}/${it.id}`, msg: `id câu trùng với nhóm ${prev}` });
      iids.set(it.id, g.id);
    }
    out.push(...checkGroup(g, list));
  }
  out.push(...checkKeyBalance(groups));
  out.push(...checkLengthCue(groups));
  return out;
}

// Độ dài ngữ liệu (số từ) của một phần đề thi thử, theo kỳ thi, kỹ năng và số điểm của phần.
// IELTS Nghe: mỗi phần ~4–7 phút nói kèm lời dẫn; IELTS Đọc Academic: bài 700–1000 từ; General Training: văn bản ngắn
// ở Phần 1–2, bài dài ở Phần 3; VSTEP Nghe: thông báo ngắn (1 câu), hội thoại (4 câu), bài nói (5 câu); VSTEP Đọc 300–700 từ.
export function mockLength(exam: string, kind: 'reading' | 'listening', marks: number): [number, number] {
  if (exam === 'vstep') {
    if (kind === 'reading') return [300, 720];
    return marks === 1 ? [30, 160] : marks <= 4 ? [160, 650] : [280, 950];
  }
  if (kind === 'listening') return [450, 1300];
  if (exam === 'ielts-gt') return marks <= 8 ? [120, 600] : [250, 1050];
  return [650, 1050];
}

// Đề thi thử (6.3, 5.5): đúng định dạng (tổng điểm, số phần, điểm từng phần), phần nào cũng thuộc một đề, id câu theo phần,
// độ dài theo vị trí, độ khó tăng dần trong đề, và độ khó trung bình giữa các đề cùng kỳ thi lệch ≤ 0,5 band
// (mỗi đề cách trung bình ≤ 0,25).
export const MOCK_BAL = 0.25;
export function checkMock(tests: MockTest[], groups: Group[]): Issue[] {
  const out: Issue[] = [];
  const bad = (where: string, msg: string): void => { out.push({ where, msg }); };
  const mock = groups.filter(g => g.mode === 'mock'), used = new Set<string>(), tids = new Set<string>();
  for (const g of mock) for (const it of g.items) if (g.part && !it.id.startsWith(g.part + '-')) bad(`${g.id}/${it.id}`, `id câu phải bắt đầu bằng id phần "${g.part}-"`);
  const bal = new Map<string, Array<{ id: string; b: number }>>();
  for (const t of tests) {
    if (tids.has(t.id)) bad(t.id, 'id đề bị trùng');
    tids.add(t.id);
    const f = MOCK_FORMAT[t.exam];
    if (!f) { bad(t.id, `kỳ thi "${t.exam}" không hợp lệ`); continue; }
    for (const sk of ['L', 'R'] as const) {
      const fmt = f[sk], parts = testGroups(t, sk, mock), where = `${t.id}/${sk}`;
      t[sk].forEach(pid => used.add(pid));
      parts.forEach((gs, i) => { if (!gs.length) bad(where, `không có phần "${t[sk][i]}"`); });
      if (parts.some(gs => !gs.length)) continue;
      const pm = parts.map(gs => gs.reduce((s, g) => s + g.items.reduce((k, it) => k + marksOf(it), 0), 0));
      const total = pm.reduce((a, b) => a + b, 0);
      if (total !== fmt.marks) bad(where, `tổng ${total} điểm, định dạng cần ${fmt.marks}`);
      if (fmt.parts && pm.join(',') !== fmt.parts.join(',')) bad(where, `điểm từng phần ${pm.join('/')}, định dạng cần ${fmt.parts.join('/')}`);
      if (t.exam === 'ielts-ac' && sk === 'R' && (pm.length !== 3 || pm.some(m => m < 13 || m > 14))) bad(where, `Đọc Academic cần 3 bài, mỗi bài 13–14 câu (đang ${pm.join('/')})`);
      if (t.exam === 'ielts-gt' && sk === 'R' && (pm.length < 4 || pm.length > 6)) bad(where, `Đọc General Training cần 4–6 văn bản (đang ${pm.length})`);
      parts.forEach((gs, i) => {
        const g = gs[0]!;
        if (!g.exams.includes(t.exam)) bad(g.part!, `phần dùng trong đề ${t.id} nhưng không ghi kỳ thi ${t.exam}`);
        if ((g.kind === 'listening') !== (sk === 'L')) bad(g.part!, `phần ${g.kind} nằm ở kỹ năng ${sk}`);
        const n = wordCount(sourceText(g).filter((_, k) => g.kind === 'reading' || g.script![k]!.sp !== 'N').join(' '));
        const [lo, hi] = mockLength(t.exam, g.kind, pm[i]!);
        if (n < lo || n > hi) bad(g.part!, `độ dài ${n} từ, chuẩn ${lo}–${hi} từ cho phần ${pm[i]} câu (${t.exam})`);
      });
      if (t.exam !== 'vstep') {
        const qts = new Set(parts.flat().map(g => g.qtype));
        if (qts.size < (sk === 'L' ? 3 : 4)) bad(where, `chỉ có ${qts.size} dạng câu; đề thật trộn nhiều dạng (≥ ${sk === 'L' ? 3 : 4})`);
      }
      // Độ khó tăng dần: phần đầu (theo điểm) không khó hơn phần cuối.
      const bs = parts.flat().flatMap(g => g.items.flatMap(it => Array(marksOf(it)).fill(it.b) as number[]));
      const q = Math.max(1, Math.floor(bs.length / 4)), avg = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
      if (avg(bs.slice(0, q)) > avg(bs.slice(-q))) bad(where, `câu đầu đề (b ≈ ${avg(bs.slice(0, q)).toFixed(1)}) khó hơn câu cuối (b ≈ ${avg(bs.slice(-q)).toFixed(1)}) — đề thật khó dần`);
      const key = `${t.exam}/${sk}`;
      bal.set(key, [...(bal.get(key) ?? []), { id: t.id, b: meanB(parts) }]);
    }
  }
  for (const [key, xs] of bal) {
    if (xs.length < 2) continue;
    const m = xs.reduce((s, x) => s + x.b, 0) / xs.length;
    for (const x of xs) if (Math.abs(x.b - m) > MOCK_BAL) bad(`${x.id}/${key}`, `độ khó trung bình ${x.b.toFixed(2)} lệch ${(x.b - m).toFixed(2)} band so với trung bình các đề (${m.toFixed(2)}); tối đa ±${MOCK_BAL}`);
  }
  for (const p of new Set(mock.map(g => g.part!))) if (!used.has(p)) bad(p, 'phần đề không thuộc đề nào trong content/exam/mock/index.json');
  return out;
}

// Đề thi thử xét riêng với bộ luyện: người học làm cả đề, nên đề không được lệch dù kho luyện đã cân.
const poolKey = (g: Group): string => (g.mode === 'mock' ? 'đề thi thử ' + g.qtype : g.qtype);

// Vị trí đáp án đúng phải rải đều (người soạn hay vô thức đặt đáp án ở B/C; thí sinh tinh ý sẽ khai thác).
// Xét mọi chế độ, kể cả bài kiểm tra đầu vào (v42: pl-r từng có 0/48 đáp án ở vị trí D). Chỉ xét câu có phương án riêng (it.opts) — danh sách dùng chung (tiêu đề, đoạn, khung từ) do nội dung quyết định.
// Mỗi dạng ≥ 12 câu: mỗi vị trí phải xuất hiện ít nhất một lần và không vị trí nào chiếm quá 1/n + 15 điểm %;
// câu chọn nhiều: không tổ hợp nào chiếm quá 25%.
export function checkKeyBalance(groups: Group[]): Issue[] {
  const out: Issue[] = [];
  const by = new Map<string, Item[]>();
  for (const g of groups) for (const it of g.items) if (it.opts) { const k = poolKey(g); by.set(k, [...(by.get(k) ?? []), it]); }
  for (const [q, its] of by) {
    const single = its.filter(it => typeof it.ans === 'string'), multi = its.filter(it => Array.isArray(it.ans));
    if (single.length >= 12) {
      const n = Math.round(single.reduce((s, it) => s + it.opts!.length, 0) / single.length);
      const pos = new Map<number, number>();
      for (const it of single) { const i = it.opts!.findIndex(o => o.k === it.ans); pos.set(i, (pos.get(i) ?? 0) + 1); }
      const max = Math.max(...pos.values()) / single.length;
      if (pos.size < n) out.push({ where: q, msg: `đáp án đúng chỉ nằm ở ${pos.size}/${n} vị trí phương án — cần rải đều` });
      if (max > 1 / n + 0.15) out.push({ where: q, msg: `một vị trí phương án là đáp án ở ${Math.round(max * 100)}% số câu — cần rải đều` });
    }
    if (multi.length >= 6) {
      const combo = new Map<string, number>();
      for (const it of multi) { const k = it.opts!.map((o, i) => (it.ans as string[]).includes(o.k) ? i : -1).filter(i => i >= 0).join(','); combo.set(k, (combo.get(k) ?? 0) + 1); }
      const max = Math.max(...combo.values()) / multi.length;
      if (max > 0.25) out.push({ where: q, msg: `một tổ hợp vị trí đáp án chiếm ${Math.round(max * 100)}% số câu chọn nhiều — cần rải đều` });
    }
  }
  return out;
}

// Gợi ý (không chặn CI): đáp án điền thường có thể kèm từ bổ nghĩa đứng ngay trước nó trong bài ("big red barn",
// "free meal voucher"). Nếu thêm từ đó vẫn trong giới hạn từ mà chưa được chấp nhận, người học viết đúng sẽ bị chấm sai.
// Bên soát độc lập đã ba lần phát hiện kiểu thiếu này, nên kiểm tự động để người soạn cân nhắc.
const NOT_MODIFIER = new Set(('the a an this that these those my your his her its our their some any each every no ' +
  'in on at to from by with for of about into onto over under near after before behind beside between through ' +
  'is are was were be been being am has have had do does did will would can could should must may might ' +
  'and or but so as than then it they we you i he she them us me him called known like such just only very ' +
  "it's that's there's here's mean take put use record buy get see find bring brought produce wear keep make out up down off around worth enough " +
  'where when which who what how why there here also even still now about approximately actually really hand').split(' '));
export function suggestVariants(groups: Group[]): Issue[] {
  const out: Issue[] = [];
  for (const g of groups) {
    if (!FROM_TEXT.has(g.qtype)) continue;
    const src = sourceText(g);
    for (const it of g.items) {
      if (answerKind(it, g) !== 'text') continue;
      const acc = (it.ans as TextAnswer).accept, line = src[it.ev.p] ?? '';
      const accN = new Set(acc.map(norm)), stem = norm(it.q);
      for (const a of acc) {
        const m = new RegExp(`(?:^|[^A-Za-z'’-])([A-Za-z][A-Za-z'’-]*) (${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![A-Za-z])`, 'i').exec(line);
        if (!m) continue;
        const prev = m[1]!.toLowerCase().replace(/[’]/g, "'"), cand = `${m[1]} ${m[2]}`;
        if (NOT_MODIFIER.has(prev) || /(?:ing|ed|ly)$/.test(prev) || accN.has(norm(cand)) || stem.includes(prev + ' ___') || !withinLimit(cand, it.limit, it.num)) continue;
        out.push({ where: `${g.id}/${it.id}`, msg: `cân nhắc chấp nhận "${cand}" (trong bài có, vẫn trong giới hạn từ)` });
        break;
      }
    }
  }
  return out;
}

// Đáp án đúng không được hay là phương án DÀI NHẤT: người soạn thường viết đáp án chính xác, đầy đủ hơn nên dài hơn,
// thí sinh tinh ý đoán được mà không cần đọc/nghe (bên soát VSTEP phát hiện ~60% so với ~25% ngẫu nhiên).
// Mỗi dạng (≥ 12 câu có phương án riêng): tỉ lệ câu mà đáp án là phương án dài nhất duy nhất ≤ 1/n + 15 điểm %.
export function checkLengthCue(groups: Group[]): Issue[] {
  const out: Issue[] = [];
  const by = new Map<string, Item[]>();
  for (const g of groups) for (const it of g.items) if (it.opts && typeof it.ans === 'string') { const k = poolKey(g); by.set(k, [...(by.get(k) ?? []), it]); }
  for (const [q, its] of by) {
    if (its.length < 12) continue;
    const n = Math.round(its.reduce((s, it) => s + it.opts!.length, 0) / its.length);
    const cued = its.filter(it => { const L = it.opts!.map(o => o.t.length), m = Math.max(...L); return L.filter(x => x === m).length === 1 && it.opts![L.indexOf(m)]!.k === it.ans; });
    const share = cued.length / its.length;
    if (share > 1 / n + 0.15) out.push({ where: q, msg: `đáp án là phương án dài nhất ở ${Math.round(share * 100)}% số câu (ngẫu nhiên ≈ ${Math.round(100 / n)}%) — cân lại độ dài: ${cued.slice(0, 8).map(it => it.id).join(', ')}${cued.length > 8 ? '…' : ''}` });
  }
  return out;
}
