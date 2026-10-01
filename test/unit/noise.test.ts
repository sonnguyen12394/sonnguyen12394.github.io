import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pinkNoise, NOISE_AMP } from '../../src/exam/noise.ts';

test('pinkNoise: đúng độ dài, biên độ nhỏ cỡ mức đặt, không im lặng, lệch về tần số thấp', () => {
  let seed = 1;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const n = pinkNoise(48000, NOISE_AMP, rnd);
  assert.equal(n.length, 48000);
  const peak = n.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  const rms = Math.sqrt(n.reduce((s, v) => s + v * v, 0) / n.length);
  assert.ok(peak > NOISE_AMP * 0.3 && peak < NOISE_AMP * 2.5, `đỉnh ${peak}`);
  assert.ok(rms > NOISE_AMP * 0.05, `rms ${rms}`);
  // Ồn hồng: mẫu liền nhau tương quan dương (ồn trắng ≈ 0)
  let c = 0; for (let i = 1; i < n.length; i++) c += n[i]! * n[i - 1]!;
  assert.ok(c / n.length / (rms * rms) > 0.3, 'phải tương quan dương');
});
