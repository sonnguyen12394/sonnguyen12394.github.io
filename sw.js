// Service worker của English Ladder: lưu app để chạy offline. index.html lấy từ mạng trước (có bản mới thì dùng ngay),
// mất mạng thì dùng bản đã lưu; tệp tĩnh khác lấy từ bộ nhớ trước. Đổi VERSION khi phát hành để xoá bộ nhớ cũ.
const VERSION = 'vl-v48';
const CORE = ['./', 'index.html', 'app.js?v=48', 'x/core.a088757d97.js', 'x/exam.8ce0a83862.js', 'x/engine.07ddb0665f.js', 'manifest.webmanifest', 'privacy.html', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
const META = 'el-meta';   // trạng thái nhắc học do app ghi (service worker không đọc được localStorage); không xoá khi đổi bản
const DATA = 'el-data';   // chi tiết bài học theo cấp (data/lv-<cấp>.<băm>.json): tên có băm nội dung nên giữ qua các bản; app tự dọn tệp cũ
const X = 'el-x';         // nội dung ôn thi (data/exam/*.json) và âm thanh bài nghe (a/*.mp3)
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== META && k !== DATA && k !== X).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const path = new URL(r.url).pathname;
  // Nội dung ôn thi và âm thanh bài nghe (tên có băm hoặc cố định theo id): lưu lâu ở ngăn riêng "el-x", phần ôn thi tự dọn bản cũ.
  if (/\/data\/(exam|engine)\/[^/]+\.json$|\/a\/[^/]+\.mp3$/.test(path)) {
    e.respondWith(caches.open(X).then(c => c.match(r).then(x => x || fetch(r).then(res => { if (res.ok && res.status === 200) c.put(r, res.clone()); return res; }))));
    return;
  }
  if (/\/data\/lv-[^/]+\.json$/.test(path)) {
    e.respondWith(caches.open(DATA).then(c => c.match(r).then(x => x || fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }))));
    return;
  }
  const page = r.mode === 'navigate' || r.url.endsWith('/index.html');
  if (page) {
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(VERSION).then(k => k.put(r, c)); return res; }).catch(() => caches.match(r).then(x => x || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(r, { cacheName: VERSION }).then(x => x || fetch(r).then(res => {
    if (res.ok && (new URL(r.url).origin === location.origin || /fonts\.(googleapis|gstatic)\.com/.test(r.url))) { const c = res.clone(); caches.open(VERSION).then(k => k.put(r, c)); }
    return res;
  })));
});

// Nhắc học không cần máy chủ: trình duyệt đánh thức service worker định kỳ (periodicsync, Chrome/Edge Android khi đã cài app).
// Qua giờ nhắc mà hôm nay chưa học thì báo một lần trong ngày. Bấm thông báo → mở app.
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
async function remindCheck() {
  const c = await caches.open(META), r = await c.match('./__remind'); if (!r) return;
  const m = await r.json().catch(() => null); if (!m || !m.on) return;
  const now = new Date(), d = ymd(now), [h, mi] = String(m.at || '20:00').split(':').map(Number);
  if (m.studied === d || m.shown === d || now.getHours() * 60 + now.getMinutes() < h * 60 + mi) return;
  await self.registration.showNotification('English Ladder: Tí đang đợi bạn', { body: m.due ? `${m.due} từ đang chờ bạn ôn. Tí giữ chỗ rồi, vào 5 phút nha 🐶` : 'Tí nhớ bạn rồi đó! Một bài 5 phút là giữ được lửa 🔥', icon: 'icons/icon-192.png', tag: 'el-remind' });
  m.shown = d; await c.put('./__remind', new Response(JSON.stringify(m)));
}
// Web Push (v19): máy chủ gửi lời nhắc đã mã hoá; luôn hiện thông báo (trình duyệt yêu cầu userVisibleOnly).
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) {}
  e.waitUntil(self.registration.showNotification(String(d.title || 'English Ladder: đến giờ học').slice(0, 80),
    { body: String(d.body || 'Học 5 phút để giữ chuỗi ngày và nhớ lâu.').slice(0, 200), icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'el-remind' }));
});
self.addEventListener('periodicsync', e => { if (e.tag === 'el-remind') e.waitUntil(remindCheck()); });
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => { const w = ws.find(x => 'focus' in x); return w ? w.focus() : self.clients.openWindow('./'); }));
});
