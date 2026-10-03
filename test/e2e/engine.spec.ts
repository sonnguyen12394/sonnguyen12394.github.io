import { readFileSync } from 'node:fs';
import { test, expect, openApp, navTo, noHorizontalScroll } from './fixtures.ts';

// M1: chọn mục tiêu, xem Target Model; dữ liệu engine khớp nội dung app.

test('chọn mục tiêu VSTEP B1, xem cần đạt gì, đặt hạn; tải lại vẫn còn', async ({ page, errors }) => {
  await openApp(page);
  await navTo(page, 'Tôi');
  await page.getByRole('button', { name: /Mục tiêu của bạn/ }).click();
  await expect(page.getByRole('heading', { name: 'Mục tiêu của bạn', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: /^VSTEP/ }).click();
  await page.getByRole('button', { name: 'Chọn VSTEP Bậc 3 (B1)' }).click();
  await expect(page.getByRole('heading', { name: 'VSTEP Bậc 3 (B1)', level: 1 })).toBeVisible();
  await expect(page.getByText('kể cả tiền đề')).toBeVisible();
  for (const h of ['Nghe', 'Đọc', 'Viết', 'Nói', 'Dạng bài thi']) await expect(page.getByRole('heading', { name: new RegExp(`^${h}`), level: 2 })).toBeVisible();
  await page.getByLabel('Ngày thi hoặc hạn muốn đạt').fill('2027-03-15');
  await page.getByRole('button', { name: 'Lưu' }).click();
  await noHorizontalScroll(page);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('vocab-ladder-v1') || '{}').e);
  expect(saved.goals).toHaveLength(1);
  expect(saved.goals[0]).toMatchObject({ id: 'vstep-b1', version: '1.0' });
  expect(saved.goals[0].date).toBe(Math.floor(Date.parse('2027-03-15T00:00:00Z') / 86400000));
  await page.reload();
  await navTo(page, 'Tôi');
  await page.getByRole('button', { name: /Mục tiêu của bạn/ }).click();
  await expect(page.getByRole('heading', { name: 'VSTEP Bậc 3 (B1)', level: 3 })).toBeVisible();
  expect(errors).toEqual([]);
});

test('IELTS: chọn band; mục Viết/Nói thi chưa có bài thì nói rõ', async ({ page, errors }) => {
  await openApp(page);
  await navTo(page, 'Tôi');
  await page.getByRole('button', { name: /Mục tiêu của bạn/ }).click();
  await page.getByRole('button', { name: /^IELTS Academic/ }).click();
  await page.getByRole('button', { name: 'Chọn IELTS Academic 6.5' }).click();
  await expect(page.getByRole('heading', { name: 'IELTS Academic 6.5', level: 1 })).toBeVisible();
  await expect(page.getByText('chưa có bài').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('đồ thị engine khớp Can-Do, unit, điểm ngữ pháp của app (chạy lại tools/engine-dump.mjs + engine-gen.ts khi lệch)', async ({ page }) => {
  await openApp(page);
  const app = await page.evaluate(() => ({
    // @ts-expect-error biến toàn cục của app.js
    cd: CANDO.map(c => 'cd:' + c.id), u: UNITS.map(u => 'u:' + u.id), g: GPOINTS.map(p => 'g:' + p.id),
  }));
  const nodes = (JSON.parse(readFileSync('content/engine/nodes.json', 'utf8')) as Array<{ id: string }>).map(n => n.id);
  const have = new Set(nodes);
  const want = [...app.cd, ...app.u, ...app.g];
  expect(want.filter(id => !have.has(id))).toEqual([]);
  expect(nodes.filter(id => /^(cd|u|g):/.test(id)).length).toBe(want.length);
});
