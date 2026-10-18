import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GATE_WS, NEXT_LV, wsPct, wordsOf, ideaHits, normEn } from '../../src/engine/gatews.ts';
import { WSITS, WSIT_K, STORIES, STORY_K, SPEAK, SPEAK_K } from '../../src/engine/testbank.ts';
import { GATE, GATE_FORMS, sanitizeGate } from '../../src/engine/gate.ts';

test('v140 thi chuyển cấp: mỗi bộ A1 / A2 có 2 bài Viết + 1 bài Nói, đúng cấp, mã không trùng, đủ ý và cụm', () => {
  const ids = new Set<string>();
  for (const goal of ['cefr-a1', 'cefr-a2']) for (const form of GATE_FORMS[goal]!) {
    const ts = GATE_WS[form]!;
    assert.ok(ts, form);
    assert.deepEqual(ts.map(t => t.kind), ['w', 'w', 's'], form);
    for (const t of ts) {
      assert.equal(t.lv, goal === 'cefr-a1' ? 'A1' : 'A2', t.id);
      assert.ok(!ids.has(t.id), t.id); ids.add(t.id);
      assert.ok(t.c.length >= 3 && t.u.length >= 3, t.id);
      assert.ok(t.min >= 20 && t.max > t.min, t.id);
    }
  }
  // A2 Key: tin nhắn ≥ 25 từ, chuyện ≥ 35 từ
  assert.deepEqual(GATE_WS['a2-1']!.filter(t => t.kind === 'w').map(t => t.min), [25, 35]);
});

test('v161 chấm Viết = 50% ý máy tìm + 50% luật; Nói = 70% ý + 30% đủ số từ; không ý thì rớt dù đúng hình thức', () => {
  const [w, , s] = GATE_WS['a2-1']!;
  const good = 'Hi Sam! Could I borrow your bike on Saturday? I need it because I want to visit my aunt in the next town. I will give it back to you on Sunday evening. Thanks, Lan';
  const off = 'Hello Sam. My name is Lan. I am a student. I like music and films. My favourite colour is blue and my house is near the school. See you soon, Lan';
  assert.deepEqual(ideaHits(w!, good), [true, true, true]);
  assert.equal(wsPct(w!, good, [[true, 'a'], [true, 'b']]), 1);
  assert.equal(ideaHits(w!, off).filter(Boolean).length, 0);
  assert.ok(wsPct(w!, off, [[true, 'a'], [true, 'b']]) < GATE.ws, 'đúng hình thức mà lạc đề không đạt');
  const sp = 'At the weekend I usually play football with my friends. Last year I went to Da Lat with my family. Next year I would like to learn Japanese. I prefer the countryside because it is quiet and green.';
  assert.deepEqual(ideaHits(s!, sp), [true, true, true, true]);
  assert.equal(wsPct(s!, sp, []), 1);
  assert.ok(wsPct(s!, 'Yes. Yes. I am fine thank you very much and you are fine too', []) < GATE.ws, 'nói lạc đề không đạt');
  assert.equal(wsPct(s!, '', []), 0);
  assert.equal(wordsOf("I'm going to the park, then I’ll eat."), 8);
});

test('v161 mọi bài cố định có từ khoá cho từng ý, bài mẫu của từng bài đạt đủ ý', () => {
  const model: Record<string, string> = {
    'g-a1-1-w1': 'Hi Ana, I am going away this weekend. Can you water my plants, please? I will be back on Monday morning. Thank you very much! Minh',
    'g-a1-1-w2': 'My bag is black and small. Today there is a phone, a book, two pens and my keys in it. I got it from my sister for my birthday.',
    'g-a1-1-s1': 'I get up at six o\'clock. For breakfast I have bread and milk. I go to work by motorbike. In the evening I watch TV with my family.',
    'g-a1-2-w1': 'Hi Tom! Do you want to go to the café with me? Let\'s meet on Saturday at three. I want a coffee with milk. See you, Hoa',
    'g-a1-2-w2': 'I live on Tran Phu Street. It is a small and quiet street. There is a market, a bakery and a pharmacy. I like it because my friends live there.',
    'g-a1-2-s1': 'I live with my parents and my brother. My home is a small house with a garden. At home I like reading books and cooking. My mother usually cooks.',
    'g-a2-1-w1': 'Hi Sam! Could I borrow your bike on Saturday? I need it because I want to visit my aunt. I will give it back on Sunday. Thanks, Lan',
    'g-a2-1-w2': 'One day Linh was walking in the park when she saw a small dog alone. She read the number on its collar and phoned it. Then an old man arrived and he was very happy.',
    'g-a2-1-s1': 'At the weekend I usually go swimming. Last year I visited Hue with my friends. Next year I would like to learn the guitar. I prefer the city because there are many shops.',
    'g-a2-2-w1': 'Hi Kim, I\'m sorry, but I can\'t go to the cinema tonight because I have to work late. How about Friday evening instead? Love, Mai',
    'g-a2-2-w2': 'Nam was waiting at the bus stop when it started to rain. Suddenly a woman shared her umbrella with him. On the bus they talked and found out that they worked in the same building.',
    'g-a2-2-s1': 'I work as a teacher and I like it because I love children. Last weekend I visited my grandparents and we cooked lunch. My favourite food is pho. Next month I am going to travel to Da Nang.',
  };
  for (const ts of Object.values(GATE_WS)) for (const t of ts) {
    assert.equal(t.k?.length, t.c.length, t.id);
    assert.ok(t.k!.every(k => k.length > 0), t.id);
    assert.deepEqual(ideaHits(t, model[t.id]!), t.c.map(() => true), t.id);
  }
});

test('v161 khuôn sinh bài: mọi tình huống / chuyện / câu hỏi Nói có từ khoá; câu trả lời mẫu đạt; câu lạc đề không đạt', () => {
  const sit: Record<string, string> = {
    'Borrowing Something': 'Hi! Could I borrow your camera this weekend? I need it because I am going to a wedding. I will give it back on Monday.',
    'An Invitation': 'Would you like to come to the beach with me on Saturday? Let\'s meet at 8 o\'clock. Don\'t forget to bring a hat.',
    'Changing a Plan': 'I\'m sorry, but I can\'t come tonight because I am sick. How about next Tuesday?',
    'A Thank-you Note': 'Thank you for the scarf! I really like the colour. I am going to wear it tomorrow.',
    'Asking for Help': 'Hi, what homework do we have? When is the next lesson? Where can I buy the book?',
    'A Message to a Neighbour': 'Can you water my plants? I will be back on Sunday. Thank you so much!',
  };
  for (const x of WSITS) {
    const k = WSIT_K[x.en]; assert.ok(k && k.length === x.c.length, x.en);
    assert.deepEqual(ideaHits({ ...GATE_WS['a2-1']![0]!, c: x.c, k }, sit[x.en]!), x.c.map(() => true), x.en);
    assert.ok(ideaHits({ ...GATE_WS['a2-1']![0]!, c: x.c, k }, 'My name is Ben. I am a student. My school is big.').filter(Boolean).length <= 1, x.en);
  }
  const story: Record<string, string> = {
    'The Lost Dog': 'Lan was walking in the park and saw a small dog. She called the number on its collar. An old man came and he was very happy.',
    'The Rainy Bus Stop': 'Ben was waiting at the bus stop and it started to rain. A woman shared her umbrella. On the bus they found they worked in the same building.',
    'The Birthday Cake': 'Mai made a birthday cake for her friend. The cake fell on the floor. She bought a new cake and her friend loved it.',
    'The Wrong Train': 'Tom got on a train to visit his cousin. He saw it was the wrong train. He phoned his cousin and she came by car.',
    'The Found Wallet': 'Kim found a wallet on a café table. She gave it to the waiter. The next day the owner came back and thanked her.',
    'The First Swim': 'Nam was afraid of the water at the pool. A teacher helped him. After some weeks he swam across the big pool.',
    'The Picnic': 'Hoa and her friends had a picnic by the river. A strong wind blew their food away. They ate at a small restaurant and laughed.',
  };
  for (const x of STORIES) {
    const k = STORY_K[x.en]; assert.ok(k, x.en);
    const t = { ...GATE_WS['a2-1']![1]!, c: ['1', '2', '3', 'past'], k: [...k, [['@past']]] };
    assert.deepEqual(ideaHits(t, story[x.en]!), [true, true, true, true], x.en);
  }
  for (const qs of Object.values(SPEAK)) for (const [q] of qs) assert.ok(SPEAK_K[q] && SPEAK_K[q]!.length, q);
  const say = (q: string, a: string) => ideaHits({ ...GATE_WS['a2-1']![2]!, c: ['x'], k: [SPEAK_K[q]!] }, a)[0];
  assert.equal(say('Do you prefer the city or the countryside? Why?', 'I prefer the city because it is fun.'), true);
  assert.equal(say('Do you prefer the city or the countryside? Why?', 'I like the city.'), false, 'thiếu lý do');
  assert.equal(say('What did you do last weekend?', 'I visited my uncle and we played chess.'), true);
  assert.equal(say('What did you do last weekend?', 'I visit my uncle and play chess.'), false, 'không dùng quá khứ');
  assert.equal(say('What food do you like best?', 'I like my teacher.'), false, 'tea$ không khớp teacher');
});

test('v161 chuẩn hoá: số đọc bằng chữ thành số, khớp đầu từ, đuôi $ khớp cả từ', () => {
  assert.equal(normEn('Twenty-one Books!'), ' 21 books ');
  const t = { ...GATE_WS['a2-1']![0]!, c: ['a', 'b'], k: [[['book']], [['pho$']]] };
  assert.deepEqual(ideaHits(t, 'I read books on my phone'), [true, false]);
  assert.deepEqual(ideaHits(t, 'I had pho and a book'), [true, true]);
});

test('v140 mở khi vững ≥ 80%; qua thì lên cấp kế; kết quả lưu phần Viết / Nói qua sanitize', () => {
  assert.equal(GATE.open, 0.8);
  assert.equal(NEXT_LV['cefr-a1'], 'cefr-a2');
  assert.equal(NEXT_LV['cefr-a2'], 'cefr-b1');
  const base = { form: 'a2-1', goal: 'cefr-a2', day: 5, n: 22, ok: 18, theta: 3, se: 0.4, p: 0.9, lo: 2.5, hi: 3.5, passed: true, secs: 600, sk: {} };
  const sv = sanitizeGate({ done: { 'a2-1': { ...base, ws: [{ id: 'g-a2-1-w1', kind: 'w', pct: 0.8, words: 30 }, { id: 'x', kind: 'z', pct: 2 }, { id: 'g-a2-1-s1', kind: 's', pct: 1.7, words: 40 }] } } })!;
  assert.deepEqual(sv.done['a2-1']!.ws, [{ id: 'g-a2-1-w1', kind: 'w', pct: 0.8, words: 30 }, { id: 'g-a2-1-s1', kind: 's', pct: 1, words: 40 }]);
  assert.equal(sanitizeGate({ done: { 'a2-1': base } })!.done['a2-1']!.ws, undefined);
});
