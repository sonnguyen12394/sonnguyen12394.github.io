// v98 Cân độ khó Mỏ Chữ bằng mô phỏng (GAME-CRITERIA §10.10). Người chơi giả chơi bằng đúng các hàm của game (goalLevel, applyWord,
// breakIce, collectChests, keepSolvable). Ra: tỉ lệ thắng và lượt dư theo màn, để chỉnh huntCurve() theo nhịp răng cưa của game ghép 3.
// Chạy: node --experimental-strip-types --no-warnings tools/sim/levels.ts [--from 1] [--to 60] [--seeds 60]
// Vòng Chữ không có trạng thái thua (không giới hạn lượt) nên không mô phỏng tỉ lệ thắng ở đây.

import { readFileSync, readdirSync } from 'node:fs';
import { goalLevel, huntCurve, applyWord, breakIce, collectChests, keepSolvable, keepGoalReachable, findPath, goalWord, type Mission, type Cell } from '../../src/engine/wordhunt.ts';
import { rand } from '../../src/engine/blocks.ts';

const arg = (k: string, d: number) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? Number(process.argv[i + 1]) : d; };
const words = ['A1', 'A2'].flatMap(lv => Object.keys(JSON.parse(readFileSync(`data/${readdirSync('data').find(f => f.startsWith(`lv-${lv}.`))!}`, 'utf8')).words))
  .map(w => w.toLowerCase()).filter(w => /^[a-z]{3,6}$/.test(w)).sort();

// Người chơi giả "điển hình": nhận ra từ nhiệm vụ ngay với xác suất KNOW, mỗi lượt sau thêm SPOT; khi chưa thấy từ nhiệm vụ nào thì chơi một
// từ ngắn có trên lưới, nhắm vào mục tiêu (băng / dưới rương) với xác suất AIM.
export interface Player { know: number; spot: number; aim: number }
export const TYPICAL: Player = { know: 0.6, spot: 0.3, aim: 0.6 };

export function playLevel(level: number, seed: number, p: Player = TYPICAL): { win: boolean; left: number; total: number } | null {
  const r = rand(seed * 977 + level), pick = [...words].sort(() => r() - 0.5).slice(0, 15);
  const pool: Mission[] = pick.map((w, i) => ({ en: w, vi: w, node: 'u:sim', id: `s${i}`, target: true }));
  const lv = goalLevel(seed * 31 + level, pool, huntCurve(level), level); if (!lv) return null;
  let g: Cell[] = lv.grid, id = lv.nextId, moves = lv.moves, chestsGot = 0;
  const ice = [...lv.ice], left = [...lv.missions], seen = new Set(left.filter(() => r() < p.know).map(m => m.en));
  const filler = [...words].sort(() => r() - 0.5).slice(0, 400), short = words.filter(w => w.length === 3);
  const goalOk = () => (lv.goal !== 'ice' || !ice.some(Boolean)) && (lv.goal !== 'chest' || chestsGot >= lv.chests);
  for (let t = 0; moves > 0; t++) {
    if (!left.length && goalOk()) break;
    let path: number[] | null = null, m: Mission | undefined;
    for (const x of left) if (seen.has(x.en)) { path = findPath(g, x.en); if (path) { m = x; break; } }
    if (!path) {
      const aim = r() < p.aim, w = aim ? goalWord(g, ice, filler) : (() => { for (const f of filler.slice(t * 7 % 300)) { const q = findPath(g, f); if (q) return { word: f, path: q }; } return null; })();
      if (!w) break; path = w.path;
    }
    const a = applyWord(g, path, seed + t, id, true);
    breakIce(ice, [...path, ...a.gemRow]); g = a.grid; id = a.nextId; moves--;
    if (lv.goal === 'chest') { const c = collectChests(g, seed + t, id); g = c.grid; id = c.nextId; chestsGot += c.got; }
    if (m) left.splice(left.indexOf(m), 1);
    keepSolvable(g, left, seed + t * 3);
    if (lv.goal !== 'words') { const prot = new Set<number>(); for (const x of left) findPath(g, x.en)?.forEach(i => prot.add(i)); keepGoalReachable(g, ice, short, seed + t * 5, prot); }
    for (const x of left) if (!seen.has(x.en) && r() < p.spot) seen.add(x.en);
  }
  return { win: !left.length && goalOk(), left: moves, total: lv.moves };
}

export function rate(level: number, seeds: number, p: Player = TYPICAL): { win: number; spare: number } {
  let n = 0, w = 0, sp = 0;
  for (let s = 1; s <= seeds; s++) { const o = playLevel(level, s, p); if (!o) continue; n++; if (o.win) { w++; sp += o.left / o.total; } }
  return { win: n ? w / n : 0, spare: w ? sp / w : 0 };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const from = arg('from', 1), to = arg('to', 60), seeds = arg('seeds', 60);
  console.log('màn  mục tiêu  thắng  lượt dư khi thắng');
  for (let L = from; L <= to; L++) {
    const o = rate(L, seeds), goal = L < 4 ? 'từ' : L % 10 === 0 ? 'băng*' : ['từ', 'băng', 'rương'][L % 3];
    console.log(`${String(L).padStart(3)}  ${goal!.padEnd(7)}  ${(o.win * 100).toFixed(0).padStart(4)}%  ${(o.spare * 100).toFixed(0).padStart(4)}%  ${'█'.repeat(Math.round(o.win * 20))}`);
  }
}
