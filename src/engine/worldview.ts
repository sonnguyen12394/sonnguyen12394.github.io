// v130 Bản đồ Phố Chữ: chỉ trình bày (mô hình từ worldmap.ts). Một khung kéo / thu phóng chứa 5 khu, đường truyện, đường lộ trình hôm nay
// và các công trình là <button> thật (Tab theo thứ tự khu). Chạm công trình → bảng dưới (tên, tiến độ, ▶ Chơi). Nút "Chơi tiếp" luôn nổi
// ở đáy khung: màn đầu vẫn chỉ một việc chính (v116–v117). Chế độ "☰ Danh sách" là lối thay thế cho trình đọc màn hình / không kéo được.

import type { ECtx } from './views.ts';
import { GAMES } from './director.ts';
import { sceneArt, type Scene } from './story.ts';
import { MAX_LV, LV_VI } from './town.ts';
import { WORLD, roadPath, type World, type WPlace, type PlaceId } from './worldmap.ts';
import { planRow, tiSay, type Dir } from './gameview.ts';
import { lobbyScene, type Phase } from './lobbyscene.ts';

// Mô tả một dòng của từng công trình (trước nằm ở thẻ game của sảnh).
export const DESC: Partial<Record<PlaceId, string>> = {
  wheel: 'Nối chữ trên vòng quay để tìm từ, mỗi màn thắp một ngọn đèn phố.',
  hunt: 'Đào chữ trong mỏ: quẹt tìm từ đúng nhiệm vụ, phá băng, lấy viên chữ.',
  fog: 'Xếp lại cấp CEFR: mỗi điểm dò mở một ô bản đồ. Trả lời thật, đúng hay sai ô đều mở.',
  tower: 'Leo tháp: mỗi đòn đánh là một câu đúng phần bạn còn thiếu để lên cấp.',
  puzzle: 'Tìm 4 nhóm từ cùng chủ đề trong 16 ô, rồi nhớ lại thêm một từ mỗi nhóm. Mỗi ngày một câu đố.',
  garden: 'Từ mới: gieo hạt, mỗi ngày tưới một lần: nhận ra → nhớ ngược → tự gõ thì cây nở hoa.',
  cafe: 'Nghe khách nói, hiểu ý, chọn câu đáp đúng văn phong. 6 khách mỗi ca.',
  talk: 'Nói (hoặc gõ) cho khách hiểu: động từ chơi là chính câu tiếng Anh của bạn.',
  signs: 'Biển hiệu bị Sương xoá: nhớ lại từ đang mờ để thắp lại biển.',
  letter: 'Cư dân nhờ bạn viết thư, tin nhắn, thiệp mời; đủ ý thì được quà trang trí phố.',
  port: 'Ra lệnh cho cần cẩu bằng giọng nói: nói cặp âm cho đúng thì hàng mới lên tàu.',
  shop: 'Câu hỏng chạy trên băng chuyền, tự gõ lại cho đúng để đóng gói. 6 đơn mỗi ca.',
  blocks: 'Trả lời đúng để nhận khối, xếp đầy hàng để nổ. Ván 3–5 phút.',
  radio: 'Nghe cả bản tin / cuộc trò chuyện rồi trả lời ý chính và chi tiết.',
  bubbles: 'Nghe một từ, chạm đúng bong bóng (ship hay sheep?). 10 từ mỗi màn.',
  ask: 'Tự đặt câu hỏi tiếng Anh cho nhân chứng để phá vụ án.',
  case: 'Đọc hồ sơ (biển báo, thư, bài báo) để tìm manh mối và phá án.',
  robot: 'Nói (hoặc gõ) lệnh tiếng Anh để robot đi lấy đúng đồ vật.',
  kara: 'Đóng một vai trong hội thoại, nghe mẫu rồi nói theo.',
  cards: 'Xếp lá bài thành câu đúng để thắng từng bàn.',
  board: 'Tung xúc xắc đi quanh phố, gặp thử thách tiếng Anh, xây nhà bằng xu.',
};

export interface WorldUi { sel: PlaceId | null; list: boolean; quests: boolean }
// v131 sảnh kiểu game (GAME-CRITERIA §18.4): thanh tài nguyên (P2), Sổ nhiệm vụ (P8). main.ts gom số liệu.
export interface WorldExtra {
  coins: number; lv: number; quests: () => string;
  // v132 sảnh kiểu Gunny (GAME-CRITERIA §19): nhân vật của người chơi (avatar.ts), Lực chữ, nhạc nền, dòng tin, giờ trong ngày.
  cb?: string;   // v133 khối Chiến Binh (fightctl bar): ⚔️ nút chính duy nhất + 🔨 Thợ rèn gợi ý
  me?: (size: number) => string; power?: number; music?: boolean; news?: string[]; made?: boolean; phase?: Phase; fresh?: number;   // fresh: số ô vừa lên bậc chưa xem
}
// Thời lượng một ván (phút, ước tính) cho phòng chờ trước ván (P7).
const DUR: Partial<Record<PlaceId, string>> = { wheel: '3', hunt: '4', fog: '10–15', tower: '5', puzzle: '4', garden: '3', cafe: '4', talk: '5', signs: '2', letter: '5', port: '3', shop: '4', blocks: '3–5', radio: '5', bubbles: '3', ask: '5', case: '5', robot: '4', kara: '4', cards: '5', board: '5' };
// Phần thân của bảng công trình (game chủ lực, Túi chữ, truyện…) do main.ts gom: main giữ trạng thái các game.
export type PanelOf = (id: PlaceId) => string;

const stars = (lv: number) => '★'.repeat(lv) + '☆'.repeat(MAX_LV - lv);
const tipOf = (p: WPlace) => (!p.game ? '' : p.next === null ? 'đủ 4 ★' : `${p.v}/${p.next} ${p.unit} tới ★ thứ ${p.lv + 1}`);

function placeBtn(c: ECtx, p: WPlace, sel: boolean, me = ''): string {
  const esc = c.host.esc, cls = ['wplace', p.isNext ? 'next' : '', p.plan >= 0 ? 'plan' : '', p.played ? 'played' : '', p.fog ? 'fogged' : '', p.game ? '' : 'mark', p.id === 'story' ? 'pin' : '', sel ? 'sel' : ''].filter(Boolean).join(' ');
  const say = (p.game ? `${p.vi}: ${p.lv} trên 4 sao${p.plan >= 0 ? `, chặng ${p.plan + 1} hôm nay${p.played ? ', đã xong' : ''}` : ''}${p.isNext ? ', chơi tiếp' : ''}${p.fog ? ', khu còn sương' : ''}` : `${p.vi}: ${LANDMARKS_SAY[p.id] ?? ''}`) + (p.dot ? ', có việc làm ngay' : '');
  // v131 ghim "Bạn ở đây" là Tí (mặc phụ kiện ở Tủ đồ); v132 nhân vật của người chơi đứng cạnh, Tí là thú cưng.
  const ico = p.id === 'story' ? `${me}${c.host.mascot?.('happy', me ? 40 : 58) ?? p.ico}` : p.ico;
  return `<button class="${cls}" data-e="wmopen" data-p="${p.id}" data-x="${p.x}" data-y="${p.y}" style="left:${p.x}px;top:${p.y}px" aria-label="${esc(say)}"${sel ? ' aria-expanded="true"' : ''}>
    ${p.id === 'story' ? '<span class="wpin" aria-hidden="true">📍 Bạn ở đây</span>' : ''}<span class="wico${p.id === 'story' ? ' wti' : ''}" aria-hidden="true">${ico}</span><b aria-hidden="true">${esc(p.vi)}</b>${p.dot ? '<span class="wdot" aria-hidden="true"></span>' : ''}${p.deco ? `<span class="wdeco" aria-hidden="true">${p.deco}</span>` : ''}${p.game ? `<span class="wst" aria-hidden="true">${stars(p.lv)}</span>` : ''}${p.plan >= 0 ? `<span class="wlamp${p.played ? ' on' : ''}" aria-hidden="true">${p.plan + 1}</span>` : ''}</button>`;
}
const LANDMARKS_SAY: Partial<Record<PlaceId, string>> = { arena: 'thử thách và luyện đề', bag: 'Túi chữ và Lò rèn', notice: 'trang trí phố và số liệu', story: 'bạn ở đây, Tí và truyện' };

// Bảng của một công trình: đầu bảng (tên, ★, mốc kế, lộ trình) + nút chơi + phần riêng do main gom.
export function viewPlace(c: ECtx, p: WPlace, extra: string, inList = false): string {
  const esc = c.host.esc, H = inList ? 'h3' : 'h2';
  const head = `<div class="wsh"><span class="wsico" aria-hidden="true">${p.ico}</span><div class="stack" style="gap:2px"><${H} id="wsh-${p.id}">${esc(p.vi)}${p.deco ? ` <span class="twd" data-deco="${p.id}" aria-label="Trang trí">${p.deco}</span>` : ''}</${H}>${p.game ? `<span class="hint"><span aria-hidden="true">${stars(p.lv)}</span> ${esc(LV_VI[p.lv]!)} · ${esc(tipOf(p))}</span>` : ''}</div></div>`;
  const desc = DESC[p.id] ? `<p class="hint">${esc(DESC[p.id]!)}</p>` : p.game ? '' : '';
  const plan = p.plan >= 0 ? `<p class="hint">🏮 Chặng ${p.plan + 1} trong lộ trình hôm nay${p.played ? ' · ✅ đã xong' : ''}</p>` : '';
  const fog = p.fog ? '<p class="hint">🌫️ Khu này còn Sương Câm (truyện chưa tới), nhưng vẫn chơi được ngay.</p>' : '';
  // v131 phòng chờ trước ván (P7): xem trước ván (thời lượng, mốc ★ kế, chặng lộ trình) rồi một nút BẮT ĐẦU lớn.
  const room = p.game ? `<div class="wroom" aria-label="Xem trước ván"><span class="wrc">⏱ ~${DUR[p.id] ?? '5'} phút</span><span class="wrc">🎯 ${esc(tipOf(p))}</span>${p.plan >= 0 ? `<span class="wrc">🏮 Chặng ${p.plan + 1}${p.played ? ' ✓' : ''}</span>` : ''}<span class="wrc">🪙 Có xu</span></div>` : '';
  const go = p.game ? `<button class="btn primary big wgo" data-e="${p.start}"${p.isNext ? ` data-g="${p.game}"` : ''}>▶ Chơi ${esc(GAMES[p.game].vi)}</button>` : '';
  const dot = p.dot ? '<p class="wdotl"><span class="wdot" aria-hidden="true"></span> Có việc làm được ngay ở đây</p>' : '';
  return `${head}${dot}${desc}${inList ? plan : ''}${fog}${inList ? '' : room}${go}${extra}`;
}

export function viewWorld(c: ECtx, w: World, ui: WorldUi, dir: Dir | null, sc: Scene | null, panel: PanelOf, goal = '', x: WorldExtra = { coins: 0, lv: 1, quests: () => '' }): string {
  const esc = c.host.esc, next = dir ? GAMES[dir.next.game] : null;
  const where = sc ? `📍 ${esc(sc.zone)}${sc.no ? ` · Chương ${sc.no}: ${esc(sc.title)}` : ` · ${esc(sc.title)}`}` : '📍 Phố Chữ';
  // Liên kết phụ (không phải nút chính, v118): cảnh truyện đã sẵn sàng để xem.
  const story = sc?.ready ? `<button class="sclink" data-e="stscene" data-ch="${sc.no}">📖 ${sc.no ? `Xem cảnh: ${esc(sc.who?.[1] ?? 'Phố')} nói lại được` : 'Bắt đầu câu chuyện'} ›</button>` : '';
  const z = w.zones.find(x => x.here) ?? w.zones[0]!, ti = dir ? tiSay(c, dir, false, sc) : '', lit = dir ? dir.plan.filter(p => dir.x.played.includes(p.game)).length : 0;
  const cta = dir && next ? `<button class="gcard dgo wcta${x.cb ? ' slim' : ''}" data-e="${next.start}" data-g="${dir.next.game}"><span class="gico" aria-hidden="true" style="font-size:30px">${next.ico}</span><span class="stack" style="gap:2px;text-align:left"><b>▶ ${dir.inPlan ? 'Chơi tiếp' : 'Chơi thêm'}: ${esc(next.vi)}</b><span class="hint">Vì: ${esc(dir.next.why)}</span></span></button>` : '';
  // v135 Sảnh A2: html.a2 (app.js A2LOBBY) ẩn bằng CSS mọi thứ trừ ⚔️ / 🔨 / mục tiêu; nút .a2tog bật tắt (hai nhãn, CSS chọn nhãn).
  // Đầu bản đồ dùng lại khung cảnh .lscene (v118): nơi đang ở, Tí, MỘT nút chơi tiếp, một thước đo phố, 3 đèn lồng.
  // v132 sảnh kiểu Gunny: thanh tài nguyên một dòng (avatar, ⚔️ Lực chữ, 🪙, 🏮, ⭐, nhạc), sân khấu vẽ (phố theo giờ, nhân vật của bạn
  // đứng cạnh Tí đang nói), dòng tin hệ thống thay khung chat, hàng lối tắt. "Chơi tiếp" vẫn là nút chính duy nhất (v117).
  const me = x.me?.(100) ?? '', pow = x.power ?? 0;
  const news = (x.news ?? []).slice(0, 3), line = news.map(esc).join(' · ');
  // Chạy chữ (hai bản nối đuôi cho liền mạch); trình đọc màn hình đọc bản đầu, bản sau ẩn. Giảm chuyển động: đứng yên, cắt "…".
  const ticker = news.length ? `<p class="lbnews" aria-live="off"><span class="lbmq"><span>📣 ${line}</span><span aria-hidden="true">📣 ${line}</span></span></p>` : '';
  const dock = me ? `<div class="lbdock" role="toolbar" aria-label="Lối tắt">
      <button class="lbd" data-e="bgopen" data-t="me"${x.fresh ? ` aria-label="Trang bị, ${x.fresh} món vừa lên bậc"` : ''}><span aria-hidden="true">⚔️</span>Trang bị${x.fresh ? '<i class="wdot" aria-hidden="true"></i>' : ''}</button>
      <button class="lbd" data-e="bgopen" data-t="look"><span aria-hidden="true">👗</span>Thời trang</button>
      <button class="lbd" data-e="bgopen" data-t="forge"><span aria-hidden="true">🔥</span>Lò rèn</button>
      <button class="lbd" data-e="wmbook"><span aria-hidden="true">📜</span>Nhiệm vụ</button>
      <button class="lbd" data-e="wmevent"><span aria-hidden="true">🎁</span>Sự kiện</button></div>` : '';
  const stage = me ? `<div class="lbstage ph-${x.phase ?? 'day'}">${lobbyScene(x.phase ?? 'day')}${ticker}
      <div class="lbrow"><button class="lbfig" data-e="${x.made ? 'bgopen' : 'bgavmake'}" data-t="me" aria-label="${x.made ? `Nhân vật của bạn, Lực chữ ${pow}: mở Trang bị` : 'Tạo nhân vật của bạn'}">${me}${x.made ? '' : '<span class="lbnew" aria-hidden="true">🎨 Tạo</span>'}</button>${ti}</div>${dock}</div>` : ti;
  const hud = `<div class="whud dbox lscene stack" style="--s1:${z.c1};--s2:${z.c2}"><span class="sceyebrow">${where}</span><h1>Hôm nay chơi gì?</h1>
    <div class="wres" role="group" aria-label="Tài nguyên">
      ${me ? `<button class="wchip wpow" data-e="bgopen" data-t="me" aria-label="Lực chữ ${pow}, mở Trang bị">⚔️ <b>${pow}</b></button>` : ''}
      <button class="wchip" data-e="wmopen" data-p="notice" aria-label="${x.coins} xu, tiêu ở Bảng tin phố">🪙 <b>${x.coins}</b></button>
      <button class="wchip" data-e="wmquests" aria-label="Đèn hôm nay ${lit}/${dir?.plan.length ?? 3}, mở Sổ nhiệm vụ">🏮 <b>${lit}/${dir?.plan.length ?? 3}</b></button>
      <button class="wchip" data-e="wmopen" data-p="bag" aria-label="Thợ Chữ cấp ${x.lv}, mở Xưởng của Tí">⭐ <b>Lv ${x.lv}</b></button>
      ${x.music === undefined ? '' : `<button class="wchip" data-e="wmmusic" aria-pressed="${x.music}" aria-label="Nhạc nền">${x.music ? '🔊' : '🔇'}</button>`}
      <span class="wchip">🌅 <b>${w.revived}/${w.zones.length}</b> khu</span><span class="wchip">★ <b>${w.stars}/${w.max}</b> sao phố</span></div>
    ${x.cb ?? ''}${stage}${cta}${story}
    ${dir ? planRow(c, dir) : ''}
    <button class="sclink a2tog" data-act="a2lobby"><span class="a2on">🧭 Hiện đủ mục (bản đồ, truyện, Túi chữ)</span><span class="a2off">🎯 Về sảnh A2 gọn</span></button></div>`;
  const tools = `<div class="wtools" role="toolbar" aria-label="Điều khiển bản đồ">
    ${ui.list ? '' : `<button class="btn small" data-e="wmzoom" data-k="1.25" aria-label="Phóng to">＋</button><button class="btn small" data-e="wmzoom" data-k="0.8" aria-label="Thu nhỏ">－</button><button class="btn small" data-e="wmhome" aria-label="Về chỗ bạn đang ở">⌂</button>`}
    <button class="btn small" data-e="wmlist" aria-pressed="${ui.list}">${ui.list ? '🗺️ Bản đồ' : '☰ Danh sách'}</button></div>`;
  if (ui.list) return `<section class="wwrap stack" aria-label="Bản đồ Phố Chữ"><div class="wside stack">${hud}${goal}</div><div class="wmain stack">${tools}<section class="wlq stack" aria-labelledby="wsh-quests"><h2 id="wsh-quests">📜 Sổ nhiệm vụ</h2>${x.quests()}</section>${viewList(c, w, panel)}</div></section>`;

  const zones = w.zones.map(z => {
    const r = z.rect;
    return `<div class="wzone${z.fog ? ' fog' : ''}${z.here ? ' here' : ''}" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px;--s1:${z.c1};--s2:${z.c2}">
      <div class="wart" aria-hidden="true">${sceneArt(z.act)}</div>
      <span class="wzn">${z.revived ? '🌅 ' : z.fog ? '🌫️ ' : ''}${esc(z.vi)}</span>${z.fog ? '<i class="wfog" aria-hidden="true"></i>' : ''}</div>`;
  }).join('');
  const route = w.route.length > 1 ? `<polyline class="wroute" points="${w.route.map(p => p.join(',')).join(' ')}"/>` : '';
  const sel = ui.sel ? w.places.find(p => p.id === ui.sel) ?? null : null;
  const byZone = w.zones.map(z => `<div role="group" aria-label="Khu ${esc(z.vi)}${z.fog ? ' (còn sương)' : ''}">${w.places.filter(p => p.zone === z.act).map(p => placeBtn(c, p, p === sel, p.id === 'story' ? x.me?.(54) ?? '' : '')).join('')}</div>`).join('');
  const sheet = ui.quests ? `<div class="wsheet stack" role="region" aria-labelledby="wsh-quests"><button class="btn ghost small wclose" data-e="wmclose" aria-label="Đóng">✕</button><div class="wsh"><span class="wsico" aria-hidden="true">📜</span><h2 id="wsh-quests">Sổ nhiệm vụ</h2></div>${x.quests()}</div>`
    : sel ? `<div class="wsheet stack" role="region" aria-labelledby="wsh-${sel.id}"><button class="btn ghost small wclose" data-e="wmclose" aria-label="Đóng">✕</button>${viewPlace(c, sel, panel(sel.id))}</div>` : '';
  return `<section class="wwrap stack" aria-label="Bản đồ Phố Chữ"><div class="wside stack">${hud}${goal}</div><div class="wmain stack">
    <div class="wmap" tabindex="0" aria-label="Bản đồ: kéo để di chuyển, chụm hoặc nút ＋ － để phóng. Phím mũi tên để kéo khi đứng ở khung." data-hx="${w.here[0]}" data-hy="${w.here[1]}">${tools}
      <div class="wworld" style="width:${WORLD.w}px;height:${WORLD.h}px">
        ${zones}
        <svg class="wbg" viewBox="0 0 ${WORLD.w} ${WORLD.h}" width="${WORLD.w}" height="${WORLD.h}" aria-hidden="true" focusable="false"><path class="wroad" d="${roadPath()}"/>${route}</svg>
        ${byZone}
      </div>
    </div>${sheet}</div></section>`;
}

// Chế độ danh sách: mọi khu, mọi công trình (tên, ★, trạng thái, ▶ Chơi); phần riêng dài (thẻ hero, Túi chữ, truyện, Bảng tin…) thu gọn
// trong "Chi tiết" để danh sách không dài cả chục màn hình. Dòng trạng thái ngắn (p.wstat) vẫn hiện ngay.
const more = (html: string, p: WPlace): string => {
  const m = html.match(/^((?:<p class="hint wstat">.*?<\/p>)*)([\s\S]*)$/)!, head = m[1] ?? '', rest = m[2] ?? '';
  return rest.trim() ? `${head}<details class="gall wmore" data-wm="${p.id}"><summary>Chi tiết ${p.game ? '' : '· mở '}${p.vi}</summary>${rest}</details>` : head;
};
function viewList(c: ECtx, w: World, panel: PanelOf): string {
  const esc = c.host.esc;
  return `<div class="wlist stack">${w.zones.map(z => `<section class="wlz stack" style="--s1:${z.c1};--s2:${z.c2}"><h2 class="wlzh">${z.revived ? '🌅 ' : z.fog ? '🌫️ ' : ''}${esc(z.vi)}${z.here ? ' <span class="hint">· 📍 bạn ở đây</span>' : ''}</h2>
    ${w.places.filter(p => p.zone === z.act).map(p => `<article class="wlp stack">${viewPlace(c, p, more(panel(p.id), p), true)}</article>`).join('')}</section>`).join('')}</div>`;
}
