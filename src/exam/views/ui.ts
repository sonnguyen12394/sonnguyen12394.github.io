// Mảnh giao diện dùng chung của phần ôn thi (dùng lại lớp CSS sẵn có trong index.html).

export const fmt = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1)).replace('.', ',');

export const card = (attrs: string, ic: string, title: string, desc: string, ico: (n: string) => string): string =>
  `<button class="unit morei" ${attrs}><span class="no">${ico(ic)}</span><span class="t"><strong>${title}</strong><span class="muted">${desc}</span></span></button>`;

// Ngày (số ngày từ 1/1/1970) ↔ chuỗi YYYY-MM-DD của ô chọn ngày.
export const dayToIso = (d: number): string => new Date(d * 86400000).toISOString().slice(0, 10);
export const isoToDay = (s: string): number | null => { const t = Date.parse(s + 'T00:00:00Z'); return Number.isFinite(t) ? Math.floor(t / 86400000) : null; };
export const dayVi = (d: number): string => { const t = new Date(d * 86400000); return `${t.getUTCDate()}/${t.getUTCMonth() + 1}/${t.getUTCFullYear()}`; };

export const SKILL_VI: Record<'L' | 'R' | 'W' | 'S', string> = { L: 'Nghe', R: 'Đọc', W: 'Viết', S: 'Nói' };

export const back = (label = 'Về trang Ôn thi', r = 'hub'): string => `<div class="row"><button class="btn" data-x="route" data-r="${r}">${label}</button></div>`;

// Hình của nhóm (sơ đồ, bản đồ): SVG tĩnh do build nhúng sau khi kiểm (không script, có <title>), nên chèn thẳng.
export const figure = (g: { svg?: string }): string => g.svg ? `<figure class="xfig" style="margin:0;max-width:560px">${g.svg}</figure>` : '';
