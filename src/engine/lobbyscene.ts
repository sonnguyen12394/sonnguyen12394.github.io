// v132 Cảnh sảnh (GAME-CRITERIA §19, M1 M6 M8): dãy phố Phố Chữ vẽ bằng SVG thuần, trời theo giờ trên máy (sáng / chiều / tối / đêm),
// mây trôi chậm, đèn cửa sổ bật khi tối, dây đèn lồng. Thuần hàm, chỉ trang trí (aria-hidden); giảm chuyển động thì mây đứng yên (CSS).

export type Phase = 'dawn' | 'day' | 'dusk' | 'night';
export const phaseOf = (hour: number): Phase => (hour >= 5 && hour < 8 ? 'dawn' : hour >= 8 && hour < 17 ? 'day' : hour >= 17 && hour < 19 ? 'dusk' : 'night');

// Nhà: x, rộng, cao, màu tường, màu mái, chữ trên biển (Phố Chữ: mỗi nhà một chữ cái).
const HOUSES: Array<[number, number, number, string, string, string]> = [
  [0, 46, 64, '#f6c28b', '#c0563b', 'A'], [44, 40, 82, '#9ad0c2', '#3b7d6e', 'B'], [82, 52, 58, '#f4e3b1', '#b2643a', 'C'],
  [132, 44, 90, '#c7b8ea', '#5e4fa2', 'D'], [174, 50, 66, '#ffd3b5', '#d0663f', 'E'], [222, 42, 78, '#b5d6f2', '#3f6fa8', 'F'],
  [262, 52, 60, '#f7b7c8', '#b84a6b', 'G'], [312, 48, 84, '#cfe8a9', '#5b8a2c', 'H'],
];

export function lobbyScene(p: Phase): string {
  const lit = p === 'night' || p === 'dusk';
  const sky = p === 'night' ? [...Array(14)].map((_, i) => `<circle cx="${(i * 53) % 360}" cy="${8 + ((i * 37) % 46)}" r="${i % 3 ? 0.9 : 1.4}" fill="#fff" opacity=".8"/>`).join('') : '';
  const orb = p === 'night' ? '<circle cx="300" cy="26" r="11" fill="#fdf3c4"/><circle cx="305" cy="22" r="10" fill="var(--lb-sky2,#2a2d5c)"/>' : `<circle cx="${p === 'dawn' ? 52 : p === 'dusk' ? 312 : 286}" cy="${p === 'day' ? 24 : 40}" r="13" fill="${p === 'day' ? '#ffe066' : '#ffb26b'}" opacity=".95"/>`;
  const cloud = (x: number, y: number, s: number, d: number) => `<g class="lb-cloud" style="--d:${d}s"><g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="18" ry="8" fill="#fff" opacity="${p === 'night' ? 0.18 : 0.85}"/><ellipse cx="12" cy="-5" rx="11" ry="8" fill="#fff" opacity="${p === 'night' ? 0.18 : 0.85}"/><ellipse cx="-10" cy="-3" rx="9" ry="6" fill="#fff" opacity="${p === 'night' ? 0.18 : 0.85}"/></g></g>`;
  const hills = `<path d="M0 104Q60 76 120 98T240 92T360 100V150H0Z" fill="${p === 'night' ? '#26305a' : p === 'dusk' ? '#8c5a7a' : '#9fd39a'}" opacity=".75"/>`;
  const houses = HOUSES.map(([x, w, h, wall, roof, ch]) => {
    const top = 132 - h, win = (wx: number, wy: number) => `<rect x="${wx}" y="${wy}" width="8" height="9" rx="1.5" fill="${lit ? '#ffd76a' : '#e9f4ff'}" stroke="rgba(0,0,0,.18)"/>`;
    const rows = Math.max(1, Math.floor((h - 34) / 18));
    const wins = Array.from({ length: rows }, (_, r) => win(x + 8, top + 20 + r * 17) + win(x + w - 16, top + 20 + r * 17)).join('');
    return `<g><path d="M${x - 2} ${top + 2}L${x + w / 2} ${top - 14}L${x + w + 2} ${top + 2}Z" fill="${roof}"/><rect x="${x}" y="${top}" width="${w}" height="${h}" fill="${wall}"/>${wins}
      <rect x="${x + w / 2 - 6}" y="${118}" width="12" height="14" rx="2" fill="${roof}" opacity=".85"/><rect x="${x + w / 2 - 9}" y="${top + 5}" width="18" height="11" rx="3" fill="#fff" stroke="${roof}" stroke-width="1.5"/><text x="${x + w / 2}" y="${top + 14}" text-anchor="middle" font-size="9" font-weight="800" fill="${roof}" font-family="system-ui,sans-serif">${ch}</text></g>`;
  }).join('');
  const lanterns = `<path d="M0 30Q90 52 180 34T360 32" fill="none" stroke="rgba(60,30,20,.5)" stroke-width="1"/>${[30, 75, 120, 165, 210, 255, 300, 345].map((x, i) => { const y = 36 + Math.round(8 * Math.sin(i * 1.3)); return `<g class="lb-lamp" style="--d:${i * 0.3}s"><rect x="${x - 4}" y="${y}" width="8" height="10" rx="3" fill="${i % 2 ? '#e84a3c' : '#f4a72c'}"/>${lit ? `<circle cx="${x}" cy="${y + 5}" r="7" fill="#ffcf5a" opacity=".3"/>` : ''}</g>`; }).join('')}`;
  return `<svg class="lbscene" viewBox="0 0 360 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">${sky}${orb}${cloud(70, 22, 1, 0)}${cloud(220, 14, 0.8, -14)}${cloud(330, 36, 0.7, -28)}${hills}${houses}${lanterns}<rect x="0" y="132" width="360" height="18" fill="${p === 'night' ? '#3a3350' : '#d9b98a'}"/><path d="M0 136H360" stroke="rgba(0,0,0,.12)" stroke-dasharray="10 8"/></svg>`;
}
