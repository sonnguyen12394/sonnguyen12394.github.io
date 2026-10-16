import { test } from 'node:test';
import assert from 'node:assert/strict';
import { noteOf, missTip, sentencesOf, coverage, lemmaOf, grammarOf } from '../../src/engine/pronote.ts';
import { corpus } from '../../tools/pronote-cov.ts';

// v142 hướng dẫn phát âm từng câu (Nói nhại, Đọc to): phiên âm ghép từ danh sách từ + bảng + luật đuôi; nối âm; từ đọc nhẹ; ngữ điệu; mẹo.
const D: Record<string, string> = { play: '/pleɪ/', watch: '/wɒtʃ/', want: '/wɒnt/', bus: '/bʌs/', school: '/skuːl/', get: '/ɡet/', book: '/bʊk/', stop: '/stɒp/', like: '/laɪk/', big: '/bɪɡ/', city: '/ˈsɪti/', happy: '/ˈhæpi/' };
const ipaOf = (w: string) => D[w];
const tok = (s: string, w: string) => noteOf(s, ipaOf).toks.find(t => t.w === w)!;

test('v142 phiên âm đuôi -s / -ed / -ing / -er theo âm cuối của từ gốc; bất quy tắc và từ rút gọn tra bảng', () => {
  assert.equal(tok('He plays.', 'plays').ipa, 'pleɪz'); assert.deepEqual(tok('He plays.', 'plays').end, { k: 's', ipa: 'z' });
  assert.equal(tok('I watched it.', 'watched').ipa, 'wɒtʃt'); assert.deepEqual(tok('I watched it.', 'watched').end, { k: 'ed', ipa: 't' });
  assert.equal(tok('I wanted it.', 'wanted').ipa, 'wɒntɪd'); assert.equal(tok('Two buses.', 'buses').ipa, 'bʌsɪz');
  assert.equal(tok('Books here.', 'books').ipa, 'bʊks'); assert.equal(tok('The blue ones.', 'ones').ipa, 'wʌnz'); assert.equal(tok('Two watches.', 'watches').ipa, 'wɒtʃɪz');
  assert.equal(tok('Hmm, I like it.', 'hmm').kind, 'word');
  const D2: Record<string, string> = { chair: '/tʃeər/', final: '/ˈfaɪnl/', gentle: '/ˈdʒentl/', pet: '/pet/' }, t2 = (s: string, w: string) => noteOf(s, x => D2[x]).toks.find(t => t.w === w)!;
  assert.equal(t2('Two chairs.', 'chairs').ipa, 'tʃeəz', 'bỏ /r/ trước đuôi phụ âm');
  assert.equal(t2('It finally works.', 'finally').ipa, 'ˈfaɪnəli'); assert.equal(t2('Say it gently.', 'gently').ipa, 'ˈdʒentli');
  assert.equal(t2('I met Peter there.', 'peter').kind, 'name', 'tên riêng không ghép bằng luật đuôi'); assert.equal(tok('It stopped.', 'stopped').ipa, 'stɒpt');
  assert.equal(tok('It is bigger.', 'bigger').ipa, 'bɪɡə'); assert.equal(tok('Two cities.', 'cities').ipa, 'ˈsɪtiz');
  assert.equal(tok('I went home.', 'went').ipa, 'went'); assert.equal(tok('The children.', 'children').ipa, 'ˈtʃɪldrən');
  assert.equal(tok("I'm here.", "i'm").ipa, 'aɪm'); assert.equal(tok("I don't know.", "don't").ipa, 'dəʊnt');
  assert.equal(tok('My friend Minh likes it.', 'minh').kind, 'name'); assert.equal(tok('It is 9:15 now.', '9:15').kind, 'num');
});

test('v142 từ đọc nhẹ, nối âm, ngữ điệu', () => {
  const n = noteOf('I go to school by bus.', ipaOf), to = n.toks.find(t => t.w === 'to')!;
  assert.equal(to.weak, 'tə'); assert.equal(to.strong, 'tuː'); assert.equal(to.content, false);
  assert.equal(noteOf('Yes, I can.', ipaOf).toks.find(t => t.w === 'can')!.weak, undefined, 'cuối câu thì đọc mạnh');
  assert.equal(noteOf('Get up!', ipaOf).toks[0]!.link, '', 'phụ âm cuối + nguyên âm đầu');
  assert.equal(noteOf('Get to school.', ipaOf).toks[0]!.link, undefined);
  assert.equal(noteOf('Stop. Get up.', ipaOf).toks[0]!.link, undefined, 'không nối qua dấu câu');
  assert.equal(noteOf('Do you like it?', ipaOf).tune, '↗');
  assert.equal(noteOf('Where is the bus?', ipaOf).tune, '↘');
  assert.equal(noteOf("Hi, Lan! How's school?", ipaOf).tune, '↘', 'câu cuối có từ để hỏi');
  assert.equal(noteOf('I like it.', ipaOf).tune, '↘');
});

test('v142 mẹo: tối đa 3, khác loại, gắn đúng bộ âm; từ máy không nghe ra có mẹo đúng âm', () => {
  const n = noteOf('He watched the big buses.', ipaOf);
  assert.ok(n.tips.length >= 1 && n.tips.length <= 3); assert.equal(new Set(n.tips.map(t => t.id)).size, n.tips.length);
  assert.equal(n.tips[0]!.snd, 's-11'); assert.ok(n.tips.some(t => t.snd === 's-10'));
  assert.equal(missTip(tok('He watched it.', 'watched')).snd, 's-10');
  assert.equal(missTip(tok('He plays.', 'plays')).snd, 's-11');
  assert.equal(missTip(noteOf('I think so.', w => ({ think: '/θɪŋk/' } as Record<string, string>)[w]).toks[1]!).id, 'end-c');
  assert.match(missTip(tok('A happy day.', 'happy')).t, /nhấn/);
});

test('v142 tách câu bài đọc: giữ Mr. / giờ 9.30, tách sau . ! ?', () => {
  assert.deepEqual(sentencesOf('Mr. Nam is here. He starts at 9.30! Is it OK? Yes.'), ['Mr. Nam is here.', 'He starts at 9.30!', 'Is it OK?', 'Yes.']);
});

test('v142 độ phủ phiên âm trên câu hội thoại + bài đọc A1–A2 thật ≥ 98% (trừ tên riêng, số)', () => {
  const c = corpus();
  assert.ok(c.dlg.length > 150 && c.read.length > 1000);
  for (const lines of [c.dlg, c.read]) {
    const r = coverage(lines, c.ipaOf);
    assert.ok(r.hit / r.n >= 0.98, `${(100 * r.hit / r.n).toFixed(1)}%: ${[...r.miss.keys()].slice(0, 30).join(' ')}`);
  }
});

test('v143 từ gốc (bài dán vào): bất quy tắc, -s / -ed / -ing / -er / -est / -ly, sở hữu', () => {
  const has = (w: string) => ['go', 'child', 'city', 'big', 'happy', 'play', 'stop', 'watch', 'quick', 'gentle', 'teacher', 'good', 'make'].includes(w);
  const L = (w: string) => { const r = lemmaOf(w, has); return `${r.base}:${r.f}`; };
  assert.equal(L('went'), 'go:past'); assert.equal(L('children'), 'child:pl'); assert.equal(L('cities'), 'city:pl'); assert.equal(L('bigger'), 'big:cmp');
  assert.equal(L('happiest'), 'happy:sup'); assert.equal(L('stopped'), 'stop:past'); assert.equal(L('making'), 'make:ing'); assert.equal(L('watches'), 'watch:pl');
  assert.equal(L('quickly'), 'quick:adv'); assert.equal(L('gently'), 'gentle:adv'); assert.equal(L("teacher's"), 'teacher:poss'); assert.equal(L('better'), 'good:cmp');
  assert.equal(L('xyzzy'), 'xyzzy:');
});

test('v143 gợi ý ngữ pháp từng câu: thì, câu hỏi, phủ định, động từ khuyết thiếu, so sánh, there is', () => {
  const G = (s: string) => grammarOf(s).map(x => x.id);
  assert.deepEqual(G('I went to the market yesterday.'), ['past']);
  assert.deepEqual(G('She is reading a book.'), ['pres-cont']);
  assert.deepEqual(G('Will you come to my party?'), ['fut-will', 'q']);
  assert.deepEqual(G('I am going to visit my aunt next week.'), ['fut-go']);
  assert.deepEqual(G('Have you ever tried Vietnamese coffee?'), ['pres-perf', 'q']);
  assert.deepEqual(G('They were watching TV when I called.'), ['past-cont']);
  assert.ok(G('I need some help.').includes('pres')); assert.ok(G('There are three apples here.').includes('there'));
  assert.ok(G('My brother is taller than me.').includes('cmp')); assert.ok(G('This is the best café in town.').includes('sup'));
  assert.deepEqual(G("You shouldn't eat too much sugar."), ['neg', 'modal']);
  assert.ok(grammarOf('I went home.')[0]!.t.length > 10);
});
