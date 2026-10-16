// v146 Chấm phát âm từng âm chạy trên máy (thử nghiệm; người sáng lập 16/10/2026 chọn "mô hình chạy ngay trên máy", kiểu ELSA).
// Mô hình wav2vec2 nhận âm vị (CTC, nhãn IPA espeak) cho ra logits [T khung × V âm]. Ở đây: đổi phiên âm câu mẫu sang bộ âm của mô hình,
// căn thẳng hàng bắt buộc (Viterbi CTC), rồi chấm từng âm bằng Goodness of Pronunciation (GOP) = log P(âm mong đợi) − log P(âm mạnh nhất)
// trung bình trên các khung của âm đó. Thuần hàm, không cần mô hình để test. Điểm là ước tính, chưa người thật kiểm; không ghi bằng chứng.

export interface GopPhone { ipa: string; tok: number; w: number }
export interface PhoneScore { ipa: string; score: number; heard: string | null; missing: boolean; t0: number; t1: number }
export interface WordScore { w: number; text: string; score: number; phones: PhoneScore[] }
export interface GopResult { score: number; words: WordScore[]; frames: number }

const SEG = /tʃ|dʒ|eɪ|aɪ|ɔɪ|aʊ|əʊ|oʊ|ɪə|eə|ʊə|iː|ɑː|ɔː|uː|ɜː|./g;
// Phiên âm kiểu Anh của app → các cách viết có thể có trong bộ âm espeak của mô hình (thử lần lượt).
const ALT: Record<string, string[]> = {
  'əʊ': ['oʊ', 'əʊ', 'o'], e: ['ɛ', 'e'], 'ɒ': ['ɑː', 'ɑ', 'ɒ', 'ɔ'], r: ['ɹ', 'r'], 'ɜː': ['ɜː', 'ɝ', 'ɚ'], 'eə': ['ɛɹ', 'ɛə', 'eə', 'ɛ'],
  'ɪə': ['ɪɹ', 'ɪə', 'ɪ'], 'ʊə': ['ʊɹ', 'ʊə', 'ʊ'], 'ɑː': ['ɑː', 'ɑ'], 'ɔː': ['ɔː', 'ɔ'], 'iː': ['iː', 'i'], 'uː': ['uː', 'u'],
  'ɡ': ['ɡ', 'g'], g: ['ɡ', 'g'], 'ə': ['ə', 'ɐ'], 'ɪ': ['ɪ', 'ᵻ'], 'eɪ': ['eɪ'], 'aɪ': ['aɪ'], 'ɔɪ': ['ɔɪ'], 'aʊ': ['aʊ'],
  'tʃ': ['tʃ'], 'dʒ': ['dʒ'], j: ['j'], 'ʌ': ['ʌ', 'ɐ'], 'æ': ['æ', 'a'], 'ʊ': ['ʊ'],
};
// Đổi một phiên âm (không có / /) sang dãy mã âm của mô hình. Âm không có trong bộ âm thì bỏ (ghi vào miss).
export function toModelPhones(ipa: string, vocab: Record<string, number>, miss?: Set<string>): Array<{ ipa: string; tok: number }> {
  const out: Array<{ ipa: string; tok: number }> = [];
  for (const s of ipa.replace(/[ˈˌ.\s/]/g, '').match(SEG) ?? []) {
    const cands = [...(ALT[s] ?? []), s, s.replace('ː', '')];
    const hit = cands.find(c => vocab[c] !== undefined);
    if (hit !== undefined) { out.push({ ipa: s, tok: vocab[hit]! }); continue; }
    // Nguyên âm đôi không có trong bộ âm: tách thành hai âm đơn.
    if (s.length === 2 && vocab[s[0]!] !== undefined && vocab[s[1]!] !== undefined) { out.push({ ipa: s, tok: vocab[s[0]!]! }, { ipa: s, tok: vocab[s[1]!]! }); continue; }
    miss?.add(s);
  }
  return out;
}

// Chuẩn hoá logits [T × V] thành log-xác-suất (log-softmax theo từng khung).
export function logSoftmax(data: ArrayLike<number>, T: number, V: number): Float32Array {
  const out = new Float32Array(T * V);
  for (let t = 0; t < T; t++) {
    let m = -Infinity; for (let v = 0; v < V; v++) m = Math.max(m, data[t * V + v]!);
    let s = 0; for (let v = 0; v < V; v++) s += Math.exp(data[t * V + v]! - m);
    const lz = m + Math.log(s); for (let v = 0; v < V; v++) out[t * V + v] = data[t * V + v]! - lz;
  }
  return out;
}

// Căn hàng bắt buộc CTC (Viterbi): trả về khung bắt đầu / kết thúc của từng âm mong đợi. null nếu âm thanh quá ngắn.
export function ctcAlign(lp: Float32Array, T: number, V: number, target: number[], blank: number): Array<[number, number]> | null {
  const L = target.length, S = 2 * L + 1; if (!L || T < L) return null;
  const lab = (s: number) => (s % 2 === 0 ? blank : target[(s - 1) >> 1]!);
  const NEG = -1e30, dp = new Float32Array(T * S).fill(NEG), bp = new Int16Array(T * S);
  dp[0] = lp[lab(0)]!; dp[1] = lp[lab(1)]!;
  for (let t = 1; t < T; t++) for (let s = 0; s < S; s++) {
    let best = dp[(t - 1) * S + s]!, from = s;
    if (s >= 1 && dp[(t - 1) * S + s - 1]! > best) { best = dp[(t - 1) * S + s - 1]!; from = s - 1; }
    if (s >= 2 && s % 2 === 1 && lab(s) !== lab(s - 2) && dp[(t - 1) * S + s - 2]! > best) { best = dp[(t - 1) * S + s - 2]!; from = s - 2; }
    dp[t * S + s] = best + lp[t * V + lab(s)]!; bp[t * S + s] = from;
  }
  let s = dp[(T - 1) * S + S - 1]! >= dp[(T - 1) * S + S - 2]! ? S - 1 : S - 2;
  if (dp[(T - 1) * S + s]! <= NEG / 2) return null;
  const span: Array<[number, number]> = target.map(() => [-1, -1]);
  for (let t = T - 1; t >= 0; t--) {
    if (s % 2 === 1) { const k = (s - 1) >> 1, sp = span[k]!; sp[0] = t; if (sp[1] < 0) sp[1] = t; }
    if (t > 0) s = bp[t * S + s]!;
  }
  return span;
}

// Chấm: GOP từng âm → 0–100. Âm mạnh nhất (không tính khoảng lặng) trên các khung của âm, nếu khác âm mong đợi và điểm thấp → "nghe gần như".
export function score(logits: ArrayLike<number>, T: number, V: number, phones: GopPhone[], words: string[], idToTok: string[], blank: number): GopResult | null {
  const lp = logSoftmax(logits, T, V), span = ctcAlign(lp, T, V, phones.map(p => p.tok), blank);
  if (!span) return null;
  const ps: PhoneScore[] = phones.map((p, k) => {
    const [t0, t1] = span[k]!; let sum = 0, n = 0; const votes = new Map<number, number>();
    for (let t = t0; t <= t1; t++) {
      let m = -Infinity, arg = -1; for (let v = 0; v < V; v++) if (v !== blank && lp[t * V + v]! > m) { m = lp[t * V + v]!; arg = v; }
      sum += lp[t * V + p.tok]! - m; n++; votes.set(arg, (votes.get(arg) ?? 0) + 1);
    }
    const g = n ? sum / n : -10, sc = Math.round(100 * Math.exp(Math.max(-10, g) / 2));
    const top = [...votes].sort((a, b) => b[1] - a[1])[0]?.[0] ?? -1;
    let blankShare = 0; for (let t = t0; t <= t1; t++) if (Math.exp(lp[t * V + blank]!) > 0.5) blankShare++;
    // Thiếu âm: điểm rất thấp và các khung của nó là khoảng lặng, hoặc là âm liền trước / liền sau (bị căn hàng "mượn" khung).
    const nb = top === phones[k - 1]?.tok || top === phones[k + 1]?.tok, missing = sc < 30 && (blankShare / Math.max(1, n) > 0.5 || nb);
    const heard = !missing && sc < 60 && top >= 0 && top !== p.tok ? idToTok[top] ?? null : null;
    return { ipa: p.ipa, score: sc, heard, missing, t0, t1 };
  });
  const ws: WordScore[] = words.map((text, w) => {
    const mine = ps.filter((_, k) => phones[k]!.w === w);
    // Điểm từ: nửa trung bình + nửa âm kém nhất (như ELSA, một âm sai là từ không còn "xanh").
    const avg = mine.length ? mine.reduce((a, x) => a + x.score, 0) / mine.length : -1, low = mine.length ? Math.min(...mine.map(x => x.score)) : -1;
    return { w, text, score: mine.length ? Math.round((avg + low) / 2) : -1, phones: mine };
  });
  const sc = ws.filter(x => x.score >= 0);
  return { score: sc.length ? Math.round(sc.reduce((a, x) => a + x.score, 0) / sc.length) : 0, words: ws, frames: T };
}
