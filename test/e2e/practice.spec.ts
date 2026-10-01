import { test, expect } from './fixtures.ts';
import AxeBuilder from '@axe-core/playwright';

test('luyện theo dạng: danh sách → bài học → làm bộ → chấm có giải thích → câu sai vào sổ', async ({ page, errors }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Bắt đầu ôn thi' }).click();
  await page.getByRole('button', { name: /IELTS Academic/ }).click();
  await page.getByRole('button', { name: 'Để sau' }).click();
  await page.getByRole('button', { name: /Luyện theo dạng câu hỏi/ }).click();
  await expect(page.getByRole('heading', { name: 'Luyện từng dạng câu hỏi' })).toBeVisible();
  await expect(page.getByText('đang soạn').first()).toBeVisible();
  await page.locator('li', { hasText: 'Đúng / Sai / Không có thông tin' }).getByRole('button', { name: 'Học & luyện' }).click();
  await expect(page.getByRole('heading', { name: 'Đúng / Sai / Không có thông tin' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bẫy người Việt hay mắc' })).toBeVisible();
  await page.getByRole('button', { name: 'Làm bộ đầu tiên' }).click();
  await expect(page.locator('form[data-xform="setcheck"] fieldset')).toHaveCount(5);
  for (const fs of await page.locator('form[data-xform="setcheck"] fieldset').all()) await fs.locator('input').first().check();
  await page.getByRole('button', { name: 'Chấm bài' }).click();
  await expect(page.getByText(/Kết quả: \d\/5/)).toBeVisible();
  await expect(page.getByText('Câu chứa đáp án:').first()).toBeVisible();
  await expect(page.locator('mark').first()).toBeVisible();
  const x = await page.evaluate(() => JSON.parse(localStorage.getItem('vocab-ladder-v1') || '{}').x);
  expect(x.attempts.some((a: { kind: string; id: string }) => a.kind === 'set' && a.id === 'r-tfng-01')).toBe(true);
  expect(Object.keys(x.nb).length).toBeGreaterThan(0);   // chọn TRUE cho cả 5 câu thì chắc chắn có câu sai
  await page.getByRole('button', { name: 'Bộ tiếp theo' }).click();
  await expect(page.getByRole('heading', { name: 'Night Shifts and Health' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('chọn HAI đáp án: mỗi đáp án một điểm, trang luyện đạt WCAG AA', async ({ page, errors }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Bắt đầu ôn thi' }).click();
  await page.getByRole('button', { name: /IELTS Academic/ }).click();
  await page.getByRole('button', { name: 'Để sau' }).click();
  await page.getByRole('button', { name: /Luyện theo dạng câu hỏi/ }).click();
  await page.locator('li', { hasText: 'Trắc nghiệm chọn nhiều đáp án' }).getByRole('button', { name: 'Học & luyện' }).click();
  await page.getByRole('button', { name: 'Làm bộ đầu tiên' }).click();
  const sets = page.locator('form[data-xform="setcheck"] fieldset');
  await expect(sets).toHaveCount(3);
  await expect(sets.first().locator('input[type=checkbox]')).toHaveCount(5);
  await expect(sets.first()).toContainText('(chọn 2)');
  for (const fs of await sets.all()) { const cb = fs.locator('input'); await cb.nth(0).check(); await cb.nth(1).check(); }
  await page.getByRole('button', { name: 'Chấm bài' }).click();
  await expect(page.getByText(/Kết quả: \d\/6/)).toBeVisible();
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(axe.violations.map(v => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  expect(errors).toEqual([]);
});

test('điền nhãn sơ đồ: hình SVG hiện, có tên cho trình đọc màn hình, chấm câu điền, không cuộn ngang ở 390px', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Bắt đầu ôn thi' }).click();
  await page.getByRole('button', { name: /IELTS Academic/ }).click();
  await page.getByRole('button', { name: 'Để sau' }).click();
  await page.getByRole('button', { name: /Luyện theo dạng câu hỏi/ }).click();
  await page.locator('li', { hasText: 'Điền nhãn sơ đồ' }).getByRole('button', { name: 'Học & luyện' }).click();
  await page.getByRole('button', { name: 'Làm bộ đầu tiên' }).click();
  await expect(page.getByRole('img', { name: 'Diagram of a home-made water filter' })).toBeVisible();
  const inputs = page.locator('form[data-xform="setcheck"] input.field');
  await expect(inputs).toHaveCount(5);
  for (const [i, v] of ['cotton cloth', 'Sand', 'charcoal', 'stones', 'cap'].entries()) await inputs.nth(i).fill(v);
  await page.getByRole('button', { name: 'Chấm bài' }).click();
  await expect(page.getByText('Kết quả: 4/5')).toBeVisible();   // "stones" sai (bài viết "gravel"), "Sand" đúng dù viết hoa
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(axe.violations.map(v => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  expect(errors).toEqual([]);
});
