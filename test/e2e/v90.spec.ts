import AxeBuilder from '@axe-core/playwright';
import { test, expect, play, toLobby } from './fixtures.ts';
import type { Page } from '@playwright/test';
import { badSpots } from '../../src/engine/workshop.ts';

// v90 (GAME-CRITERIA §9.3): quyết định là hành động tiếng Anh, không đổi câu hỏi hay cách tính bằng chứng.
//   Xưởng: chạm chỗ hỏng trước khi gõ (đúng chỗ: bằng chứng như cũ; sai chỗ: app chỉ chỗ hỏng → câu gõ sau đó là câu có gợi ý).
//   Quán: khách phản ứng theo loại câu đáp (đúng ý / lệch văn phong / không đúng ý); đúng / sai vẫn chỉ theo đáp án.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

async function open(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }];
    w.eval('save()'); w.eval("go('games')");
  });
  await toLobby(page);
}
const peek = (page: Page) => page.evaluate(() => (window as any).eval('EM').peek());
const axe = async (page: Page) => {
  const r = await new AxeBuilder({ page }).include('#app').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
};
const lastLed = (page: Page) => page.evaluate(() => { const l = (window as any).eval('st').e.ev.led; return l[l.length - 1]; });

test('Xưởng: chạm đúng chỗ hỏng → bằng chứng không trợ giúp; chạm sai → app chỉ chỗ hỏng, câu gõ sau đó có gợi ý', async ({ page, errors }) => {
  await open(page);
  await play(page, 'wsstart');
  // Đơn 1: chạm đúng chỗ hỏng rồi gõ đúng.
  let pk = await peek(page);
  expect(pk.run).toBe('shop');
  const good = pk.accept[0] as string, right = badSpots(pk.prompt, good);
  expect(right.length).toBeGreaterThan(0);
  await page.locator(`[data-e="wsspot"][data-i="${right[0]}"]`).click();
  await expect(page.locator('.fb.good')).toContainText('Đúng chỗ hỏng');
  await expect(page.locator('[data-e="wsspot"]')).toHaveCount(0);   // một lần mỗi đơn
  await page.locator('input[name="a"]').fill(good); await page.locator('input[name="a"]').press('Enter');
  let led = await lastLed(page);
  expect(led.ok).toBe(1); expect(led.lv).toBe(4); expect(led.asst).toBeUndefined();
  await page.locator('[data-e="wsnext"]').click();
  // Đơn sau: chạm sai chỗ → chỗ hỏng hiện ra (tô xanh), câu gõ đúng sau đó là có trợ giúp. Câu ngắn thiếu từ có thể không còn
  // "chỗ sai" để chạm (mọi từ đều kề chỗ thiếu): bỏ qua đơn đó, gõ thẳng.
  let wrong = -1, r2: number[] = [];
  for (let k = 0; k < 5 && wrong < 0; k++) {
    pk = await peek(page);
    r2 = badSpots(pk.prompt, pk.accept[0]);
    wrong = (pk.prompt as string).split(/\s+/).filter(Boolean).findIndex((_, i) => !r2.includes(i));
    if (wrong < 0) { await page.locator('input[name="a"]').fill(pk.accept[0]); await page.locator('input[name="a"]').press('Enter'); await page.locator('[data-e="wsnext"]').click(); }
  }
  expect(wrong).toBeGreaterThanOrEqual(0);
  await page.locator(`[data-e="wsspot"][data-i="${wrong}"]`).click();
  await expect(page.locator('.wsw.no')).toHaveCount(1);
  await expect(page.locator('.wsw.ok')).toHaveCount(r2.length);
  await page.screenshot({ path: 'test-results/shop-spot.png' });
  await axe(page);
  await page.locator('input[name="a"]').fill(pk.accept[0]); await page.locator('input[name="a"]').press('Enter');
  led = await lastLed(page);
  expect(led.ok).toBe(1); expect(led.asst).toBe(1);
  expect(errors).toEqual([]);
});

test('Quán: chọn câu đúng ý nhưng lệch văn phong → khách 😮, không có sao, vẫn là câu sai; đúng → 😊 + tiền boa', async ({ page, errors }) => {
  await open(page);
  await play(page, 'cfstart');
  const end = page.getByRole('heading', { name: /Đóng ca/ });
  let sawReg = false, sawOk = false;
  for (let i = 0; i < 30 && !(await end.isVisible()); i++) {
    const next = page.locator('[data-e="cfnext"]');
    if (await next.isVisible()) { await next.click(); continue; }
    const pk = await peek(page);
    if (!pk || pk.run !== 'cafe') break;
    // eFn xáo phương án mỗi lần gọi: lấy loại phản ứng theo chữ của phương án, rồi tìm vị trí trên màn.
    const kinds: Record<string, string> = await page.evaluate(() => { const w = window as any, p = w.eval('EM').peek(), it = w.eval('EHOST').fn(p.node).find((x: any) => x.id === p.id); const o: Record<string, string> = {}; (it?.opts ?? []).forEach((t: string, i: number) => { o[t] = it.react?.[i] ?? ''; }); return o; });
    const reg = (pk.opts as string[]).findIndex(t => kinds[t] === 'reg');
    if (!sawReg && reg >= 0) {
      await page.locator(`[data-e="cfans"][data-i="${reg}"]`).click();
      await expect(page.locator('.fb.bad')).toContainText('hơi lạ tai');
      await page.screenshot({ path: 'test-results/cafe-reg.png' });
      await axe(page);
      const led = await lastLed(page);
      expect(led.ok).toBe(0); expect(led.node.startsWith('fn:')).toBe(true);
      sawReg = true; continue;
    }
    await page.locator(`[data-e="cfans"][data-i="${pk.ans}"]`).click();
    if (!sawOk) { await expect(page.locator('.fb.good')).toContainText('Tiền boa'); sawOk = true; }
  }
  expect(sawOk).toBe(true);
  expect(sawReg).toBe(true);
  expect(errors).toEqual([]);
});
