/* 作家導覽頁：自訂 JavaScript（Bootstrap 本身的 JS 在 js/bootstrap.bundle.min.js） */

// ===== 0. 深淺色：依裝置設定切換 Bootstrap 5.3 的 data-bs-theme（先於畫面載入，避免閃爍） =====
(function () {
  const m = window.matchMedia('(prefers-color-scheme: dark)');
  const set = () => document.documentElement.setAttribute('data-bs-theme', m.matches ? 'dark' : 'light');
  set();
  m.addEventListener('change', set);
})();

// ===== 1. Google Analytics 4 =====
// 貼上 GA4 的「評估 ID」（G-XXXXXXXXXX）。留空則不載入 GA、不送出任何資料。
const GA_ID = 'G-K89PV6KNY3';
(function initGA() {
  if (!GA_ID) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  gtag('js', new Date());
  // 每個 html 頁面載入時，GA 會自動送出 page_view。
  // 首頁不論從 / 還是 /index.html 進來，都統一記成 /，避免在報表裡被拆成兩列。
  gtag('config', GA_ID, {page_location: location.origin + location.pathname.replace(/index\.html$/, '') + location.search});
  const sc = document.createElement('script');
  sc.async = true;
  sc.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
  document.head.appendChild(sc);
})();

// 自訂事件。用 beacon 傳送，點連結跳頁時事件也不會掉
function track(name, params) {
  if (!window.gtag) return;
  gtag('event', name, Object.assign({transport_type: 'beacon'}, params));
}

// ===== 2. 事件：音檔播放、點作品卡片、點外部連結 =====
document.addEventListener('DOMContentLoaded', () => {

  // 音檔播放：play 事件不會冒泡，所以用 capture 監聽
  // 只計「從頭開始播放」；暫停後繼續播放不重複計算
  document.addEventListener('play', e => {
    const a = e.target;
    if (!a.matches || !a.matches('audio[data-audio]')) return;
    if (a.currentTime < 0.5) track('audio_play', {work_id: a.dataset.audio, work_title: a.dataset.title});
  }, true);

  document.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a) return;
    if (a.dataset.work) track('select_work', {work_id: a.dataset.work, work_title: a.dataset.title, pos: +a.dataset.pos});
    else if (a.dataset.out) track('outbound_click', {work_id: a.dataset.out, work_title: a.dataset.title, label: a.textContent.trim()});
  });

});
