import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validate, render, type Conf, type Card } from '../../tools/score/score.ts';

// v63: bảng chấm 200 + 400 tiêu chí là dữ liệu kiểm được. Điểm cao nhất phải trỏ tới test có thật; tài liệu sinh lại khớp dữ liệu.
const conf = JSON.parse(readFileSync('tools/score/conformance.json', 'utf8')) as Conf;
const card = JSON.parse(readFileSync('tools/score/scorecard.json', 'utf8')) as Card;

test('bảng chấm hợp lệ: đủ C1–C400, 10 Hard Fail, 20 Meta-Test; mọi điểm cao có test thật', () => {
  assert.deepEqual(validate(conf, card), []);
});

test('docs/SCORE.md được sinh lại từ dữ liệu chấm (không sửa tay)', () => {
  assert.equal(readFileSync('docs/SCORE.md', 'utf8'), render(conf, card));
});
