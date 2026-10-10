import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reactOf, tip, MOOD } from '../../src/engine/cafe.ts';
import { badSpots } from '../../src/engine/workshop.ts';

test('v90 Quán: khách phản ứng theo loại câu đáp; đúng / sai vẫn chỉ theo đáp án; tiền boa thưởng văn phong hợp', () => {
  const react = ['off', 'ok', 'reg', 'off'];
  assert.equal(reactOf(react, 1, 1), 'ok');
  assert.equal(reactOf(react, 1, 2), 'reg', 'đúng ý, lệch văn phong');
  assert.equal(reactOf(react, 1, 0), 'off');
  assert.equal(reactOf(react, 1, -1), 'dunno');
  assert.equal(reactOf(undefined, 1, 2), 'off', 'câu cũ không có dữ liệu phản ứng → coi như không đúng ý');
  assert.ok(tip('ok') > tip('reg') && tip('reg') > tip('off') && tip('off') === tip('dunno'));
  assert.deepEqual(Object.keys(MOOD).sort(), ['dunno', 'off', 'ok', 'reg']);
});

test('v90 Xưởng: tìm chỗ hỏng — từ sai, từ thừa, thiếu từ (hai từ kề chỗ thiếu), dấu câu / hoa thường không tính', () => {
  assert.deepEqual(badSpots('She go to school.', 'She goes to school.'), [1]);
  assert.deepEqual(badSpots('Her is my sister.', 'She is my sister.'), [0]);
  assert.deepEqual(badSpots('I am agree with you.', 'I agree with you.'), [1], 'từ thừa');
  assert.deepEqual(badSpots('He is doctor.', 'He is a doctor.'), [1, 2], 'thiếu "a": chạm "is" hay "doctor" đều đúng chỗ');
  assert.deepEqual(badSpots('She beautiful.', 'She is beautiful.'), [0, 1]);
  assert.deepEqual(badSpots('I like it', 'I like it.'), [], 'chỉ khác dấu câu: không có từ nào để chạm (màn ẩn phần tìm chỗ hỏng)');
});
