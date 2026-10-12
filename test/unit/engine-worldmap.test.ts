import { test } from 'node:test';
import assert from 'node:assert/strict';
import { world, layout, clampCam, camCss, roadPath, ZONES, ZONE_OF, WORLD, LANDMARKS, type WPlace } from '../../src/engine/worldmap.ts';
import { town, MAX_LV } from '../../src/engine/town.ts';
import { freshE } from '../../src/engine/state.ts';
import { GAMES, type GameId } from '../../src/engine/director.ts';
import { ACTS } from '../../src/engine/story.ts';

const ids = Object.keys(GAMES) as GameId[];
const inRect = (p: WPlace) => { const z = ZONES[p.zone]!; return p.x > z.x && p.x < z.x + z.w && p.y > z.y && p.y < z.y + z.h; };
const W = (over: Partial<Parameters<typeof world>[0]> = {}) => world({ b: town(freshE()), act: 0, done: false, plan: [], played: [], next: null, ...over });

test('v130 bản đồ: mỗi game có đúng một công trình, đủ 5 khu theo truyện, mốc không phải game có mặt', () => {
  assert.equal(ZONES.length, ACTS.length);
  const flat = ZONE_OF.flat();
  for (const g of ids) assert.equal(flat.filter(x => x === g).length, 1, `${g} phải nằm đúng một khu`);
  assert.equal(flat.length, new Set(flat).size);
  for (const act of [0, 1, 2, 3, 4]) {
    const w = W({ act });
    for (const g of ids) assert.equal(w.places.filter(p => p.game === g).length, 1);
    for (const m of Object.keys(LANDMARKS)) assert.equal(w.places.filter(p => p.id === m).length, 1, `${m} ở khu ${act}`);
    assert.equal(w.places.find(p => p.id === 'story')!.zone, act, 'ghim truyện nằm ở khu của chương đang mở');
  }
});

test('v130 bản đồ: khu nằm trong thế giới, không chồng nhau; công trình nằm trong khu của nó và cách nhau đủ để không đè chữ', () => {
  for (const z of ZONES) assert.ok(z.x >= 0 && z.y >= 0 && z.x + z.w <= WORLD.w && z.y + z.h <= WORLD.h);
  for (let i = 0; i < ZONES.length; i++) for (let j = i + 1; j < ZONES.length; j++) {
    const a = ZONES[i]!, b = ZONES[j]!;
    assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, `khu ${i} và ${j} chồng nhau`);
  }
  for (const act of [0, 1, 2, 3, 4]) {
    const ps = W({ act }).places;
    for (const p of ps) assert.ok(inRect(p), `${p.id} ra ngoài khu ${p.zone}`);
    // Ô công trình rộng 128, cao ~90 đơn vị (CSS .wplace): hai tâm phải cách nhau đủ một trong hai chiều.
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
      const a = ps[i]!, b = ps[j]!;
      assert.ok(Math.abs(a.x - b.x) >= 132 || Math.abs(a.y - b.y) >= 96, `${a.id} đè ${b.id} (khu ${act})`);
    }
  }
  assert.deepEqual(layout({ x: 0, y: 0, w: 400, h: 264 }, 1), [[200, 164]]);
});

test('v130 bản đồ: sương chỉ phủ khu truyện chưa tới, không khoá game nào; hết mùa 1 thì cả phố hồi sinh', () => {
  const w = W({ act: 2 });
  assert.deepEqual(w.zones.map(z => z.fog), [false, false, false, true, true]);
  assert.deepEqual(w.zones.map(z => z.revived), [true, true, false, false, false]);
  assert.equal(w.revived, 2);
  // Công trình trong sương vẫn có nút chơi (start) như mọi công trình khác.
  for (const p of w.places.filter(p => p.game)) assert.equal(p.start, GAMES[p.game!].start);
  assert.ok(w.places.some(p => p.fog && p.game));
  const end = W({ act: 4, done: true });
  assert.ok(end.zones.every(z => !z.fog && z.revived));
  assert.equal(end.revived, 5);
});

test('v130 bản đồ: ★ khớp Phố chung, lộ trình hôm nay nối 3 chặng, game chơi tiếp được đánh dấu; không đổi bản lưu', () => {
  const e = freshE();
  e.gq = { stars: 22, runs: 3, best: 6, day: 1 } as typeof e.gq;
  const before = JSON.stringify(e), b = town(e);
  const w = world({ b, act: 1, done: false, plan: ['cafe', 'garden', 'case'], played: ['cafe'], next: 'garden' });
  assert.equal(JSON.stringify(e), before);
  const cafe = w.places.find(p => p.game === 'cafe')!;
  assert.equal(cafe.lv, b.find(x => x.game === 'cafe')!.lv);
  assert.equal(cafe.lv, 2);
  assert.equal(w.stars, b.reduce((a, x) => a + x.lv, 0));
  assert.equal(w.max, ids.length * MAX_LV);
  assert.deepEqual([cafe.plan, cafe.played, cafe.isNext], [0, true, false]);
  const garden = w.places.find(p => p.game === 'garden')!;
  assert.deepEqual([garden.plan, garden.played, garden.isNext], [1, false, true]);
  assert.equal(w.route.length, 3);
  assert.deepEqual(w.route[1], [garden.x, garden.y]);
  assert.equal(w.places.filter(p => p.isNext).length, 1);
  assert.match(roadPath(), /^M[\d.]+ [\d.]+( C[\d. ]+){4}$/);
});

test('v130 camera: kẹp độ phóng và biên để không kéo bản đồ ra khỏi khung', () => {
  const c = clampCam({ cx: -500, cy: 99999, z: 99 }, 390, 540);
  assert.equal(c.z, 2.5);
  assert.ok(c.cx >= 390 / 2 / c.z && c.cy <= WORLD.h - 540 / 2 / c.z);
  const small = clampCam({ cx: 500, cy: 700, z: 0.01 }, 390, 540);
  assert.ok(small.z >= 0.35);
  // Khung rộng hơn cả thế giới ở độ phóng nhỏ nhất: tâm về giữa thế giới.
  const wide = clampCam({ cx: 0, cy: 0, z: 0.35 }, 2000, 2000);
  assert.deepEqual([wide.cx, wide.cy], [WORLD.w / 2, WORLD.h / 2]);
  assert.equal(camCss({ cx: 500, cy: 750, z: 1 }, 400, 600), 'translate(-300px,-450px) scale(1)');
});
