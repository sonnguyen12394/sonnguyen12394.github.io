import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ieltsBand, ieltsOverall, vstepSkillScore, vstepLevel, bandToCefr, bandToVstep, vstepToBand, IELTS_LISTENING, IELTS_READING_AC, IELTS_READING_GT, SOURCES } from '../../src/exam/scales.ts';

test('IELTS Listening theo bảng công bố', () => {
  const cases: Array<[number, number]> = [[40, 9], [39, 9], [38, 8.5], [35, 8], [34, 7.5], [32, 7.5], [31, 7], [30, 7], [29, 6.5], [26, 6.5], [25, 6], [23, 6], [22, 5.5], [18, 5.5], [17, 5], [16, 5], [15, 4.5], [13, 4.5], [12, 4], [11, 4]];
  for (const [raw, band] of cases) assert.equal(ieltsBand('ielts-ac', 'L', raw).band, band, `raw ${raw}`);
  assert.equal(ieltsBand('ielts-ac', 'L', 30).official, true);
  assert.equal(ieltsBand('ielts-ac', 'L', 9).official, false);
  assert.equal(ieltsBand('ielts-ac', 'L', 0).band, 0);
});

test('IELTS Academic Reading theo bảng công bố', () => {
  const cases: Array<[number, number]> = [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [32, 7], [30, 7], [29, 6.5], [27, 6.5], [26, 6], [23, 6], [22, 5.5], [19, 5.5], [18, 5], [15, 5], [14, 4.5], [13, 4.5], [12, 4], [10, 4]];
  for (const [raw, band] of cases) assert.equal(ieltsBand('ielts-ac', 'R', raw).band, band, `raw ${raw}`);
});

test('IELTS General Training Reading theo bảng công bố', () => {
  const cases: Array<[number, number]> = [[40, 9], [39, 8.5], [38, 8], [37, 8], [36, 7.5], [35, 7], [34, 7], [33, 6.5], [32, 6.5], [31, 6], [30, 6], [29, 5.5], [27, 5.5], [26, 5], [23, 5], [22, 4.5], [19, 4.5], [18, 4], [15, 4]];
  for (const [raw, band] of cases) assert.equal(ieltsBand('ielts-gt', 'R', raw).band, band, `raw ${raw}`);
});

test('bảng giảm dần, band không tăng khi số câu giảm, mọi dòng có nguồn', () => {
  for (const t of [IELTS_LISTENING, IELTS_READING_AC, IELTS_READING_GT]) {
    for (let i = 1; i < t.rows.length; i++) {
      assert.ok(t.rows[i]!.min < t.rows[i - 1]!.min);
      assert.ok(t.rows[i]!.band < t.rows[i - 1]!.band);
    }
    assert.equal(t.rows.at(-1)!.min, 0);
    assert.ok(SOURCES[t.source]);
    // dòng chính thức đứng trước mọi dòng ước tính
    const firstEst = t.rows.findIndex(r => !r.official);
    assert.ok(t.rows.slice(firstEst).every(r => !r.official));
  }
});

test('bài ngắn quy tỉ lệ về 40 và không được coi là chính thức', () => {
  const r = ieltsBand('ielts-ac', 'R', 10, 13);
  assert.equal(r.raw40, 31);
  assert.equal(r.band, 7);
  assert.equal(r.scaled, true);
  assert.equal(r.official, false);
});

test('điểm tổng IELTS làm tròn đúng quy tắc', () => {
  assert.equal(ieltsOverall([6.5, 6.5, 5, 7]), 6.5);     // 6.25 → 6.5
  assert.equal(ieltsOverall([6.5, 6.5, 5.5, 6]), 6);     // 6.125 → 6
  assert.equal(ieltsOverall([7, 7, 6.5, 6.5]), 7);       // 6.75 → 7
  assert.equal(ieltsOverall([4, 4, 4, 4]), 4);
  assert.equal(ieltsOverall([6, 6.5, 6.5, 6.5]), 6.5);   // 6.375 → 6.5
});

test('VSTEP: điểm kỹ năng và bậc theo Quyết định 729', () => {
  assert.equal(vstepSkillScore(35, 35), 10);
  assert.equal(vstepSkillScore(0, 35), 0);
  assert.equal(vstepSkillScore(20, 40), 5);
  assert.equal(vstepSkillScore(21, 35), 6);
  assert.equal(vstepLevel([4, 4, 4, 3.5]).level, 'Bậc 3 (B1)');   // 3.875 → 4.0
  assert.equal(vstepLevel([3.5, 3.5, 3.5, 4]).level, 'Chưa đạt bậc 3');   // 3.625 → 3.5
  assert.equal(vstepLevel([5.5, 5.5, 6, 6]).level, 'Bậc 4 (B2)');  // 5.75 → 6
  assert.equal(vstepLevel([8, 8, 8.5, 9]).level, 'Bậc 5 (C1)');    // 8.375 → 8.5
  assert.equal(vstepLevel([8, 8, 8, 8]).level, 'Bậc 4 (B2)');
});

test('CEFR và quy đổi chéo đơn điệu', () => {
  assert.equal(bandToCefr(4), 'B1');
  assert.equal(bandToCefr(5), 'B1');
  assert.equal(bandToCefr(5.5), 'B2');
  assert.equal(bandToCefr(6.5), 'B2');
  assert.equal(bandToCefr(7), 'C1');
  assert.equal(bandToCefr(8), 'C1');
  assert.equal(bandToCefr(8.5), 'C2');
  assert.equal(bandToCefr(3), 'A2');
  let prev = -1;
  for (let b = 0; b <= 9; b += 0.5) { const v = bandToVstep(b); assert.ok(v >= prev); prev = v; }
  prev = -1;
  for (let s = 0; s <= 10; s += 0.5) { const v = vstepToBand(s); assert.ok(v >= prev); prev = v; }
  // cùng cấp CEFR ở hai chiều
  for (const b of [4, 5, 5.5, 6.5, 7, 8]) assert.equal(bandToCefr(vstepToBand(bandToVstep(b))), bandToCefr(b), `band ${b}`);
});
