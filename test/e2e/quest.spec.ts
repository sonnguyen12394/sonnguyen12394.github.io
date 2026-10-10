import { test, expect, openAll } from './fixtures.ts';

// v62 Ladder Quest: mỗi lượt là một câu do engine chọn; câu trả lời vào bản đồ năng lực, xu/tim/tầng chỉ là telemetry.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

test('Ladder Quest: vào từ Thử thách, leo một tầng, câu trả lời thành bằng chứng, kết quả game không vào mastery', async ({ page, errors }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }];
    w.eval('save()');
    w.eval("go('games')");
  });
  await page.getByRole('button', { name: '▶ Chơi' }).click();
  await page.getByRole('heading', { name: /Hôm nay chơi gì/ }).waitFor({ timeout: 15000 }); await openAll(page);
  await expect(page.getByRole('heading', { name: /Leo tháp tiếng Anh/ })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/chỉ câu trả lời mới được tính/)).toBeVisible();
  await openAll(page);
  await page.getByRole('button', { name: /Leo tầng 1/ }).click();
  const end = page.getByRole('heading', { name: /Qua tầng|Hết tim/ });
  // Câu đầu chọn phương án đầu tiên, các câu sau "Không biết"; trại thì đọc bí kíp rồi đi tiếp.
  for (let i = 0; i < 20 && !(await end.isVisible()); i++) {
    const next = page.locator('[data-e="qnext"]'), dunno = page.getByRole('button', { name: 'Không biết' }).first();
    await expect(next.or(dunno).or(end).first()).toBeVisible();
    if (await end.isVisible()) break;
    if (await next.isVisible()) { await next.click(); continue; }
    await dunno.click();
  }
  await expect(end).toBeVisible();
  const e = await page.evaluate(() => (window as any).eval('st').e);
  const ev = e.ev.led.filter((x: any) => x.src === 'game' || (x.src === 'transfer' && String(x.ch).startsWith('quest-1:')));
  expect(ev.length).toBeGreaterThanOrEqual(3);
  expect(ev.every((x: any) => String(x.ch).startsWith('quest-1:1:'))).toBe(true);
  expect(e.q.runs).toBe(1);
  expect(e.q.ans).toBe(ev.length);
  expect(e.ev.snap.some((s: any) => String(s.dec).startsWith('quest:'))).toBe(true);
  // v65: snapshot tầng ghi loại lỗ hổng đã quyết định câu hỏi.
  expect(typeof e.ev.snap.find((s: any) => String(s.dec).startsWith('quest:')).info.gaps).toBe('string');
  // Giới hạn trung thực: một tầng là lượt hữu hạn, có điểm dừng.
  await expect(page.getByText(/Nghỉ ở đây cũng tốt/)).toBeVisible();
  await page.getByRole('button', { name: 'Về tháp' }).click();
  await page.getByRole('heading', { name: /Hôm nay chơi gì/ }).waitFor({ timeout: 15000 }); await openAll(page);
  await expect(page.getByRole('heading', { name: /Leo tháp tiếng Anh/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test('v69–v70: phần chưa có bằng chứng được hỏi thử trước (không dạy thứ có thể đã biết); trại có 1 câu thử ngay sau bí kíp; sai có một dòng "vì sao"', async ({ page, errors }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }];
    w.eval('save()'); w.eval("go('play')");
  });
  await page.getByRole('heading', { name: /Hôm nay chơi gì/ }).waitFor({ timeout: 15000 });
  await openAll(page);
  await page.getByRole('button', { name: /Leo tầng 1/ }).click();
  const end = page.getByRole('heading', { name: /Qua tầng|Hết tim/ });
  let taught = 0, checked = 0, why = 0;
  for (let i = 0; i < 30 && !(await end.isVisible()); i++) {
    const next = page.locator('[data-e="qnext"]'), chk = page.locator('[data-e="qcheck"]'), dunno = page.getByRole('button', { name: 'Không biết' }).first();
    await expect(next.or(chk).or(dunno).or(end).first()).toBeVisible();
    if (await end.isVisible()) break;
    if (await chk.isVisible()) { await chk.click(); checked++; continue; }
    if (await next.isVisible()) { if (await page.getByText('💡').count()) why++; await next.click(); continue; }
    if (await page.locator('[data-teach]').count()) taught++;
    // Câu đầu "Không biết" (để thấy dòng vì sao), các câu sau trả lời đúng (đáp án lấy từ EM.peek, chỉ đọc) để còn tim tới trại.
    const pk = i === 0 ? null : await page.evaluate(() => (window as any).eval('EM').peek());
    if (!pk) { await dunno.click(); continue; }
    if (pk.opts) await page.locator(`[data-e="qans"][data-i="${pk.ans}"]`).click();
    else { await page.locator('input[name="a"]').fill(pk.accept[0]); await page.locator('input[name="a"]').press('Enter'); }
  }
  await expect(end).toBeVisible();
  expect(taught).toBe(0);   // v70 (bot L02): chưa có bằng chứng ≠ chưa biết → hỏi thử trước; thẻ dạy chỉ khi đã sai / đang hiểu sai
  expect(checked).toBe(1);
  expect(why).toBeGreaterThan(0);
  const e = await page.evaluate(() => (window as any).eval('st').e);
  expect(e.ev.led.some((x: any) => x.src === 'micro' && x.ctx === 'micro' && x.asst === 1)).toBe(true);   // câu thử sau trại: có trợ giúp
  expect(e.ev.snap.some((s: any) => String(s.dec).startsWith('micro:') && s.info?.from === 'quest-camp')).toBe(true);
  expect(e.ev.snap.find((s: any) => String(s.dec).startsWith('quest:')).info.gaps).toContain('unproven');
  expect(errors).toEqual([]);
});
