import { test } from 'node:test';
import assert from 'node:assert/strict';
import { score, BEATS } from '../../src/engine/bgm.ts';
import { phaseOf, lobbyScene } from '../../src/engine/lobbyscene.ts';

test('v132 M7 nhạc sảnh: cùng hạt giống ra cùng bản; 3 bè; mọi nốt nằm trong vòng 16 ô nhịp; âm lượng nhỏ; gam ngũ cung', () => {
  const a = score(132), b = score(132);
  assert.deepEqual(a, b);
  assert.notDeepEqual(score(7), a);
  assert.ok(a.every(n => n.t >= 0 && n.t + n.d <= BEATS + 0.001 && n.v > 0 && n.v <= 0.025 && n.f > 50 && n.f < 2500));
  assert.equal(new Set(a.map(n => n.w)).size, 2);              // sine (bass, giai điệu) + triangle (hợp âm rải)
  const bass = a.filter(n => n.v === 0.022);                    // bè bass có âm lượng riêng
  assert.equal(bass.length, BEATS / 4);                         // một nốt bass mỗi ô nhịp
  const penta = new Set([0, 2, 4, 7, 9]);
  const mel = a.filter(n => n.w === 'sine' && n.f >= 500);
  assert.ok(mel.length >= 16);
  assert.ok(mel.every(n => penta.has(((Math.round(12 * Math.log2(n.f / 261.63)) % 12) + 12) % 12)));
});

test('v132 M8 cảnh sảnh: trời theo giờ; đêm có sao và đèn cửa sổ; luôn aria-hidden', () => {
  assert.deepEqual([6, 12, 18, 23, 2].map(phaseOf), ['dawn', 'day', 'dusk', 'night', 'night']);
  const night = lobbyScene('night'), day = lobbyScene('day');
  assert.match(night, /#ffd76a/); assert.doesNotMatch(day, /#ffd76a/);
  assert.match(day, /aria-hidden="true"/);
  assert.ok(!/\sid="/.test(night));
});
