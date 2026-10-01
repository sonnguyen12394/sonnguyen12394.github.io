// Đưa một từ trong bài về dạng gốc để tra cấp CEFR (kiểm cấp độ, yêu cầu 8.4). Luật đơn giản, có danh sách bất quy tắc.

// Từ chức năng và từ rất cơ bản (A1) mà danh sách theo unit không liệt kê riêng.
export const BASE_A1 = new Set(`a an the and or but so if because than then that this these those there here what who whom whose which where when why how
i me my mine you your yours he him his she her hers it its we us our ours they them their theirs myself yourself himself herself itself ourselves themselves
be am is are was were been being have has had having do does did done doing will would shall should can could may might must
not no yes to of in on at for with from by about as into onto over under up down out off than too very also just only all any some
each every both either neither other another such much many more most few less least own same so one two three four five six seven eight nine ten
first second third last next mr mrs ms dr st etc ok okay oh well let am pm`.split(/\s+/));

// Động từ bất quy tắc và dạng đặc biệt → từ gốc.
const IRREG: Record<string, string> = {
  went: 'go', gone: 'go', saw: 'see', seen: 'see', took: 'take', taken: 'take', made: 'make', came: 'come', got: 'get', gotten: 'get',
  gave: 'give', given: 'give', knew: 'know', known: 'know', thought: 'think', told: 'tell', said: 'say', found: 'find', left: 'leave',
  felt: 'feel', kept: 'keep', held: 'hold', brought: 'bring', bought: 'buy', built: 'build', began: 'begin', begun: 'begin', wrote: 'write',
  written: 'write', ran: 'run', sat: 'sit', stood: 'stand', understood: 'understand', spoke: 'speak', spoken: 'speak', met: 'meet',
  paid: 'pay', sent: 'send', spent: 'spend', lost: 'lose', led: 'lead', grew: 'grow', grown: 'grow', drew: 'draw', drawn: 'draw',
  chose: 'choose', chosen: 'choose', fell: 'fall', fallen: 'fall', rose: 'rise', risen: 'rise', drove: 'drive', driven: 'drive',
  ate: 'eat', eaten: 'eat', drank: 'drink', drunk: 'drink', slept: 'sleep', taught: 'teach', caught: 'catch', fought: 'fight',
  sought: 'seek', sold: 'sell', heard: 'hear', meant: 'mean', became: 'become', broke: 'break', broken: 'break', wore: 'wear', worn: 'wear',
  won: 'win', hid: 'hide', hidden: 'hide', flew: 'fly', flown: 'fly', forgot: 'forget', forgotten: 'forget', shook: 'shake', shaken: 'shake',
  struck: 'strike', stole: 'steal', stolen: 'steal', swam: 'swim', threw: 'throw', thrown: 'throw', woke: 'wake', woken: 'wake',
  dealt: 'deal', fed: 'feed', fled: 'flee', lit: 'light', bent: 'bend', bound: 'bind', laid: 'lay', lay: 'lie', lain: 'lie', rode: 'ride',
  ridden: 'ride', sang: 'sing', sung: 'sing', rang: 'ring', rung: 'ring', shot: 'shoot', shone: 'shine', sank: 'sink', sunk: 'sink',
  spun: 'spin', sprang: 'spring', stuck: 'stick', swept: 'sweep', tore: 'tear', torn: 'tear', withdrew: 'withdraw', withdrawn: 'withdraw',
  arose: 'arise', arisen: 'arise', overcame: 'overcome', undertook: 'undertake', undertaken: 'undertake', forbade: 'forbid', forbidden: 'forbid',
  better: 'good', best: 'good', worse: 'bad', worst: 'bad', further: 'far', furthest: 'far', farther: 'far', children: 'child', people: 'person',
  men: 'man', women: 'woman', feet: 'foot', teeth: 'tooth', mice: 'mouse', data: 'data', criteria: 'criterion', phenomena: 'phenomenon',
  analyses: 'analysis', hypotheses: 'hypothesis', lives: 'life', wives: 'wife', knives: 'knife', leaves: 'leaf', halves: 'half', selves: 'self',
  "isn't": 'be', "aren't": 'be', "wasn't": 'be', "weren't": 'be', "don't": 'do', "doesn't": 'do', "didn't": 'do', "can't": 'can',
  "couldn't": 'could', "won't": 'will', "wouldn't": 'would', "shouldn't": 'should', "haven't": 'have', "hasn't": 'have', "hadn't": 'have',
  "mustn't": 'must', "i'm": 'i', "you're": 'you', "we're": 'we', "they're": 'they', "it's": 'it', "that's": 'that', "there's": 'there',
  "i've": 'i', "you've": 'you', "we've": 'we', "they've": 'they', "i'll": 'i', "you'll": 'you', "we'll": 'we', "they'll": 'they', "he'll": 'he',
  "she'll": 'she', "it'll": 'it', "i'd": 'i', "you'd": 'you', "he'd": 'he', "she'd": 'she', "we'd": 'we', "they'd": 'they', "let's": 'let',
  "he's": 'he', "she's": 'she', "what's": 'what', "who's": 'who', "where's": 'where', "here's": 'here',
};

export function candidates(w: string): string[] {
  const x = w.toLowerCase().replace(/[’]/g, "'");
  const out = [x];
  if (IRREG[x]) out.push(IRREG[x]);
  const base = x.replace(/'s$/, '');
  if (base !== x) out.push(base);
  const add = (s: string): void => { if (s.length >= 2) out.push(s); };
  if (base.endsWith('ies')) add(base.slice(0, -3) + 'y');
  if (base.endsWith('es')) add(base.slice(0, -2));
  if (base.endsWith('s')) add(base.slice(0, -1));
  if (base.endsWith('ied')) add(base.slice(0, -3) + 'y');
  if (base.endsWith('ed')) { add(base.slice(0, -2)); add(base.slice(0, -1)); if (/(.)\1ed$/.test(base)) add(base.slice(0, -3)); }
  if (base.endsWith('ing')) { add(base.slice(0, -3)); add(base.slice(0, -3) + 'e'); if (/(.)\1ing$/.test(base)) add(base.slice(0, -4)); }
  if (base.endsWith('ier')) add(base.slice(0, -3) + 'y');
  if (base.endsWith('iest')) add(base.slice(0, -4) + 'y');
  if (base.endsWith('er')) { add(base.slice(0, -2)); add(base.slice(0, -1)); }
  if (base.endsWith('est')) { add(base.slice(0, -3)); add(base.slice(0, -2)); }
  if (base.endsWith('ily')) add(base.slice(0, -3) + 'y');
  if (base.endsWith('ly')) { add(base.slice(0, -2)); add(base.slice(0, -2) + 'le'); }
  return [...new Set(out)];
}

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type Level = typeof LEVELS[number];

export function levelOf(w: string, list: Record<string, string>): Level | null {
  let best: number | null = null;
  for (const c of candidates(w)) {
    if (BASE_A1.has(c)) return 'A1';
    const L = list[c];
    if (L) { const i = LEVELS.indexOf(L as Level); if (i >= 0 && (best === null || i < best)) best = i; }
  }
  return best === null ? null : LEVELS[best]!;
}

// Tách từ của một văn bản; bỏ số, bỏ tên riêng (viết hoa không ở đầu câu).
export function tokens(text: string): Array<{ w: string; proper: boolean }> {
  const out: Array<{ w: string; proper: boolean }> = [];
  const re = /[A-Za-z][A-Za-z'’-]*|[.!?:]/g;
  let m: RegExpExecArray | null, sentStart = true;
  while ((m = re.exec(text))) {
    const t = m[0];
    if (/^[.!?:]$/.test(t)) { sentStart = true; continue; }
    for (const part of t.split('-').filter(Boolean)) {
      const proper = !sentStart && /^[A-Z]/.test(part) && part !== 'I';
      out.push({ w: part.replace(/['’]+$/, ''), proper });
    }
    sentStart = false;
  }
  return out;
}
