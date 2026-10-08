import { test, expect, openApp } from './fixtures.ts';

// v54 (spec v2.4 §37, HG30): màn "Vì sao?" giải thích kết luận bằng bằng chứng; mục tiêu CEFR nói rõ còn thiếu gì.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

test('đạt một cụm từ vựng → "Vì sao?" hiện số liệu, ngưỡng, luật, lịch sử kết luận và bằng chứng', async ({ page, errors }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st'), t = w.eval('today()');
    st.onboarded = true;
    for (let i = 0; i < 12; i++) w.ELCORE.ev(st, { node: 'u:a1-u1', level: 3, ok: true, g: 0, item: 'w:t' + i, qt: 'typed', ctx: 'rcl', src: 'vocab' }, t);
    w.eval('save()');
    w.eval("go('goal',{er:'why/u:a1-u1'})");
  });
  await expect(page.locator('.eyebrow', { hasText: 'Vì sao?' })).toBeVisible();
  await expect(page.getByText('Lịch sử kết luận')).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/luật ev1\.0\/m3\.2/).first()).toBeVisible();
  await expect(page.getByText('Bằng chứng gần nhất')).toBeVisible();
  expect(errors).toEqual([]);
});

test('mục tiêu CEFR A1: "Chưa đạt A1 vì còn thiếu…" và màn Vì sao liệt kê năng lực còn thiếu', async ({ page, errors }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }];
    w.eval('save()');
    w.eval("go('goal',{er:'goal/cefr-a1'})");
  });
  await expect(page.getByText(/Chưa đạt A1 vì còn thiếu/)).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Vì sao?', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: /Vì sao chưa đạt/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Còn thiếu \d+ năng lực/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test('model disagreement: Đạt rồi sai 2 lần ở câu mới → "Vì sao?" báo mở lại; chọn cùng phương án sai → giả thuyết hiểu sai', async ({ page, errors }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st'), t = w.eval('today()');
    st.onboarded = true;
    for (let i = 0; i < 25; i++) w.ELCORE.ev(st, { node: 'g:g-a1-01', level: 3, ok: true, item: 'g:ok' + i, qt: 'gtp', src: 'gram' }, t);
    for (let i = 0; i < 2; i++) w.ELCORE.ev(st, { node: 'g:g-a1-01', level: 3, ok: false, item: 'g:new' + i, qt: 'gtp', src: 'gram', given: 'I is' }, t);
    w.eval('save()');
    w.eval("go('goal',{er:'why/g:g-a1-01'})");
  });
  await expect(page.getByText(/app mở lại và cần/)).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('heading', { name: 'Có thể đang hiểu sai' })).toBeVisible();
  await expect(page.getByText('I is', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('NBA: mở Lộ trình hôm nay ghi snapshot bước tiếp theo kèm phân rã lợi ích; "Vì sao?" giải thích lựa chọn', async ({ page, errors }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }];
    w.eval('save()');
    w.eval("go('goal',{er:'today'})");
  });
  await expect(page.getByText(/Bước tiếp theo/).first()).toBeVisible({ timeout: 15000 });
  const snap = await page.evaluate(() => [...(window as any).eval('st').e.ev.snap].reverse().find((s: any) => s.kind === 'nba'));
  expect(snap.info.k).toMatch(/^(learn|review|probe|verify|transfer)$/);
  expect(String(snap.info.parts)).toContain('×');
  expect(snap.rule).toMatch(/nba-3$/);
  if (snap.subj !== 'review') {
    await page.evaluate((id: string) => (window as any).eval(`go('goal',{er:'why/${id}'})`), snap.subj);
    await expect(page.getByText('Vì sao app chọn phần này làm bước tiếp theo')).toBeVisible();
  }
  expect(errors).toEqual([]);
});
