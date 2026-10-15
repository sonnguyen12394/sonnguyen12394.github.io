// v134 Chiến Binh Chữ: bảng tỉ lệ thắng trận (kiểu Chaos Orbit) theo tay né × chênh bậc Vũ khí so với bậc cần (C2: đồ ~70%, tay ~30%).
// Chạy: npm run fightsim [-- số trận mỗi ô] [-- nv] (nv: thêm bảng theo nhân vật). Dải cần giữ được khoá ở test/unit/engine-fight.test.ts.
import { FIGHTS, DODGE, winRate, simFight, type DodgeLv } from '../../src/engine/fight.ts';
import { CHAR_IDS } from '../../src/engine/fightmeta.ts';

const N = Number(process.argv[2]) || 100, lvs = Object.keys(DODGE) as DodgeLv[];
const t0 = Date.now();
const only = process.argv.find(a => a.startsWith('k1-'));
for (const def of FIGHTS.filter(d => !only || d.id === only)) {
  console.log(`\n${def.vi} (cần bậc ${def.need}) · ${N} trận mỗi ô`);
  console.log('tay né  ' + [-2, -1, 0, 1, 2].map(d => `${d >= 0 ? '+' : ''}${d}`.padStart(7)).join(''));
  for (const a of lvs) {
    const row = [-2, -1, 0, 1, 2].map(d => { const w = def.need + d; return w < 0 ? '    —  ' : `${Math.round(winRate(def, { w, giap: 0, khien: 0 }, a, N) * 100)}%`.padStart(7); });
    console.log(a.padEnd(8) + row.join(''));
  }
  const f = simFight(def, { w: def.need, giap: 0, khien: 0 }, 'avg', 5);
  console.log(`  mẫu (né TB, đúng bậc): ${f.over} ${f.why} · ${Math.round(f.t)} giây · cấp ${f.p.level} · hạ ${f.kills} · máu ${Math.round(f.p.hp)}`);
}
if (process.argv.includes('nv')) {
  const boss = FIGHTS.find(f => f.id === 'k1-boss')!;
  console.log(`\nNhân vật (boss, đúng bậc, né TB, ${N} trận)`);
  for (const ch of CHAR_IDS) console.log(ch.padEnd(12) + `${Math.round(winRate(boss, { w: boss.need, giap: 0, khien: 0 }, 'avg', N, 1, ch) * 100)}%`);
}
console.log(`\n${((Date.now() - t0) / 1000).toFixed(1)} giây`);
