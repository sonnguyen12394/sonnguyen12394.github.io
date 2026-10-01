#!/usr/bin/env node
// Tách/ghép nội dung bài học của English Ladder (v22).
//   node tools/content-split.cjs split   app.js đầy đủ → app.js (khung mọi cấp + chi tiết A1) + data/lv-<cấp>.<băm>.json
//   node tools/content-split.cjs join    ngược lại: ghép data/*.json vào app.js để có lại bản đầy đủ (sửa nội dung rồi split lại)
// Khung (luôn nằm trong app.js): unit {id,no,title,vi,words}, từ {id,word,pos,ipa,pic,vi,forms,family,…}.
// Chi tiết (tải sau, theo cấp): unit {reading,guided}, từ {en,ex,exVi,ex2,ex2Vi,cloze,col,why,tip}.
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..'), APP = path.join(ROOT, 'app.js'), DATA = path.join(ROOT, 'data');
const U_DETAIL = ['reading', 'guided'], W_DETAIL = ['en', 'ex', 'exVi', 'ex2', 'ex2Vi', 'cloze', 'col', 'why', 'tip'];
const INLINE = ['A1'];   // cấp có sẵn chi tiết trong app.js (màn chào và bài đầu chạy ngay)

const src = fs.readFileSync(APP, 'utf8');
// Khối CONTENT: từ "const CONTENT = " tới hết dấu ; đóng khối ở cuối dòng, trước khai báo top-level kế tiếp.
function findContent(s) {
  const a = s.indexOf('\nconst CONTENT = '); if (a < 0) throw new Error('không thấy const CONTENT');
  const lines = s.slice(a + 1).split('\n'); let j = 1;
  while (j < lines.length && !/^(const|let|var|function|async function|\/\*|\/\/)/.test(lines[j])) j++;
  const text = lines.slice(0, j).join('\n'), start = a + 1, end = start + text.length;
  const obj = vm.runInNewContext('(' + text.replace(/^const CONTENT = /, '').replace(/;\s*$/, '') + ')');
  return { start, end, obj };
}
const setConst = (s, name, value) => {   // thay "const NAME = …;" (một dòng)
  const re = new RegExp('^const ' + name + ' = .*$', 'm');
  if (!re.test(s)) throw new Error('không thấy const ' + name);
  return s.replace(re, () => `const ${name} = ${value};`);
};
const writeContent = (s, c, obj) => s.slice(0, c.start) + 'const CONTENT = {levels:[\n' + obj.levels.map(L => JSON.stringify(L)).join(',\n') + '\n]};' + s.slice(c.end);

const cmd = process.argv[2];
if (cmd === 'split') {
  const c = findContent(src), C = c.obj, hash = {};
  if (!fs.existsSync(DATA)) fs.mkdirSync(DATA);
  for (const f of fs.readdirSync(DATA)) if (/^lv-.*\.json$/.test(f)) fs.unlinkSync(path.join(DATA, f));
  for (const L of C.levels) {
    if (INLINE.includes(L.id)) continue;
    const d = { units: {}, words: {} };
    for (const u of L.units) {
      const ud = {}; for (const k of U_DETAIL) if (k in u) { ud[k] = u[k]; delete u[k]; }
      if (Object.keys(ud).length) d.units[u.id] = ud;
      for (const w of u.words) { const wd = {}; for (const k of W_DETAIL) if (k in w) { wd[k] = w[k]; delete w[k]; } if (Object.keys(wd).length) d.words[w.id] = wd; }
    }
    const json = JSON.stringify(d), h = crypto.createHash('sha256').update(json).digest('hex').slice(0, 10);
    fs.writeFileSync(path.join(DATA, `lv-${L.id}.${h}.json`), json); hash[L.id] = h;
  }
  let out = writeContent(src, c, C);
  out = setConst(out, 'DETAIL_HASH', JSON.stringify(hash));
  fs.writeFileSync(APP, out);
  console.log('split ok', hash);
} else if (cmd === 'join') {
  const c = findContent(src), C = c.obj;
  const m = src.match(/^const DETAIL_HASH = (.*);$/m), hash = m ? JSON.parse(m[1]) : {};
  for (const L of C.levels) {
    if (!hash[L.id]) continue;
    const d = JSON.parse(fs.readFileSync(path.join(DATA, `lv-${L.id}.${hash[L.id]}.json`), 'utf8'));
    for (const u of L.units) { Object.assign(u, d.units[u.id] || {}); for (const w of u.words) Object.assign(w, d.words[w.id] || {}); }
  }
  let out = writeContent(src, c, C);
  out = setConst(out, 'DETAIL_HASH', '{}');
  fs.writeFileSync(APP, out);
  console.log('join ok (app.js đầy đủ; nhớ chạy split trước khi phát hành)');
} else {
  console.log('Dùng: node tools/content-split.cjs split|join');
}
