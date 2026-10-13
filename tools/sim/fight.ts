// v133 Mô phỏng trận (docs/KE-HOACH-A2.md C2): bot ngắm theo 3 mức sai số × chênh bậc Vũ khí so với bậc cần → bảng tỉ lệ thắng.
// Chạy: npm run fightsim [-- số trận mỗi ô]. Dải cần giữ được khoá ở test/unit/engine-fight.test.ts.
import { FIGHTS, AIM, winRate, simFight, type AimLv } from '../../src/engine/fight.ts';

const N = Number(process.argv[2]) || 200;
for (const def of FIGHTS) {
  console.log(`\n${def.vi} (${def.id}, cần bậc ${def.need}) · ${N} trận mỗi ô`);
  console.log('tay ngắm  ' + [-2, -1, 0, 1, 2].map(d => `Δ${d >= 0 ? '+' : ''}${d}`.padStart(7)).join(''));
  for (const a of Object.keys(AIM) as AimLv[]) {
    const row = [-2, -1, 0, 1, 2].map(d => { const w = def.need + d; return w < 0 ? '    —  ' : `${Math.round(winRate(def, { w, giap: 0, khien: 0 }, AIM[a], N) * 100)}%`.padStart(7); });
    console.log(a.padEnd(10) + row.join(''));
  }
  const f = simFight(def, { w: def.need, giap: 0, khien: 0 }, AIM.avg, 5);
  console.log(`ví dụ (trung bình, đúng bậc): ${f.over} sau ${f.round} vòng, ${f.shots} phát, trúng ${f.hits}`);
}
