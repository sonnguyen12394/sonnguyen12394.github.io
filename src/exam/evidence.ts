// Câu ôn thi → bằng chứng mastery cho engine (docs/SPEC.md §2): nút x:<dạng câu>, mức theo độ khó của câu
// (band < 5,5 → mức 3; < 7 → mức 4; còn lại mức 5, khớp mức cần của Target Model IELTS/VSTEP). Câu kiểm tra đầu vào (pl-…) không tính.

import type { Host } from './host.ts';
import { QT } from './content.ts';
import { contentVer } from './packs.ts';

export function examEvidence(host: Host, qtype: string, item: { id: string; b?: number }, ok: boolean, ctx: string): void {
  if (!host.evidence || qtype.startsWith('pl-') || !QT[qtype]) return;
  const b = item.b ?? 5.5, level = b < 5.5 ? 3 : b < 7 ? 4 : 5;
  host.evidence({ node: `x:${qtype}`, level, ok, g: QT[qtype]!.guess, item: item.id, qt: qtype, ctx, src: 'exam', cv: contentVer(item.id) });
}
