/* 作家導覽頁：自訂 JavaScript（Bootstrap 本身的 JS 在 js/bootstrap.bundle.min.js） */

// ===== 0. 深淺色：依裝置設定切換 Bootstrap 5.3 的 data-bs-theme（先於畫面載入，避免閃爍） =====
(function () {
  const m = window.matchMedia('(prefers-color-scheme: dark)');
  const set = () => document.documentElement.setAttribute('data-bs-theme', m.matches ? 'dark' : 'light');
  set();
  m.addEventListener('change', set);
})();

// DOM 準備好之後才執行其餘邏輯
document.addEventListener('DOMContentLoaded', () => {

// ===== 1. 內容設定：只要改這裡 =====
const AUTHOR = '作家姓名';
const WORKS = [
  {id:'work-1', title:'潮聲', kind:'長篇小說', color:'#1f4e4a',
   line:'一座漁港，三代人，一個沒說出口的名字。',
   audio:{src:'audio/work-1.wav', label:'作者朗讀（試聽）'},
   intro:['故事從一場延遲了三十年的葬禮開始。返鄉的女兒在老屋裡翻出一本沒有署名的航海日誌。','每翻過一頁，港口的潮水就退得更遠，露出家族一直不願面對的往事。'],
   links:[['博客來','https://example.com/'],['Readmoo','https://example.com/']]},
  {id:'work-2', title:'夜行書店', kind:'散文集', color:'#5b2a45',
   line:'凌晨兩點才開門的書店，只賣給失眠的人。',
   audio:{src:'audio/work-2.wav', label:'作者朗讀（試聽）'},
   intro:['二十四篇關於夜晚的短文，寫等待、寫失眠，也寫城市裡沒有人看見的角落。','適合睡前讀一篇，不需要從頭讀到尾。'],
   links:[['博客來','https://example.com/'],['試讀第一篇','https://example.com/']]},
  {id:'work-3', title:'舊城地圖', kind:'短篇小說集', color:'#8a5a08',
   line:'用十二條街，重畫一座消失的城。',
   audio:{src:'audio/work-3.wav', label:'作者朗讀（試聽）'},
   intro:['十二個短篇，各自發生在同一座城市的不同街道，人物會在別篇裡悄悄再出現。','讀完全部，才會看見完整的地圖。'],
   links:[['博客來','https://example.com/'],['Readmoo','https://example.com/']]},
  {id:'work-4', title:'山語', kind:'詩集', color:'#2f3f6b',
   line:'寫給走過山路的人，也寫給沒能回來的人。',
   audio:{src:'audio/work-4.wav', label:'作者朗讀（試聽）'},
   intro:['六十首短詩，圍繞山、霧與腳步聲展開，語言克制，留白很多。','附有作者的手寫註記與山徑照片。'],
   links:[['博客來','https://example.com/'],['作者簽名版','https://example.com/']]}
];

// ===== 2. 追蹤層：所有事件都經過 track() =====
const KEY = 'author_tpl_events';
let log = [];
try { log = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) {}
const qs = new URLSearchParams(location.search);
const SRC = qs.get('utm_source') || 'direct';     // QR 來源，例如 poster、namecard
const CONTENT = qs.get('utm_content') || '-';     // 投放位置，例如 booth-A
// Google Sheet 統計：貼上 Apps Script「網頁應用程式」的網址（以 /exec 結尾）。留空則不送出。
const SHEET_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyf53IIyaJ35oDVuHbfK0PI59k6Qv0cO_rLkfNZ5u3oH5HxW0zr5mj0N9-cgVowUhSg/exec';
const SHEET_EVENTS = ['work_view', 'audio_play'];   // 只送作品頁瀏覽與音檔播放
function sendToSheet(name, params) {
  if (!SHEET_ENDPOINT || SHEET_EVENTS.indexOf(name) < 0 || !params || !params.work_id) return;
  const w = WORKS.find(x => x.id === params.work_id);
  const body = JSON.stringify({
    event: name, work_id: params.work_id, work_title: w ? w.title : '',
    src: SRC, content: CONTENT, url: location.href.split('#')[0]
  });
  // text/plain 不會觸發 CORS 預檢；no-cors 只負責送出，不讀回應
  try {
    fetch(SHEET_ENDPOINT, {method: 'POST', mode: 'no-cors', keepalive: true,
      headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: body});
  } catch (e) {}
}

function track(name, params) {
  log.push(Object.assign({t: Date.now(), name: name, src: SRC}, params));
  try { localStorage.setItem(KEY, JSON.stringify(log.slice(-500))); } catch (e) {}
  sendToSheet(name, params);
  // 正式上線時，在這裡接上你的分析工具（擇一）：
  // gtag('event', name, params);                         // GA4
  // plausible(name, {props: params});                    // Plausible
  // umami.track(name, params);                           // Umami
  // navigator.sendBeacon('/api/track', JSON.stringify({name, ...params})); // 自建
}

// ===== 3. 畫面（使用 Bootstrap 格線與元件） =====
const app = document.getElementById('app');
const clearModal = () => bootstrap.Modal.getOrCreateInstance(document.getElementById('clearModal'));
const showToast = msg => {
  document.getElementById('appToastBody').textContent = msg;
  bootstrap.Toast.getOrCreateInstance(document.getElementById('appToast'), {delay: 2500}).show();
};
let landed = false;
const cover = (w, extra) => '<div class="cover ' + (extra || '') + '" style="--c:' + w.color + '"><span class="t">' + w.title + '</span><span class="a">' + AUTHOR + '</span></div>';

function homeView() {
  return '<h1 class="site-title mt-5 mb-2">' + AUTHOR + '</h1>' +
    '<p class="lead-narrow text-secondary mb-5">寫小說、散文與詩。這裡收著四本書的簡介，選一本開始讀。</p>' +
    '<ul class="row row-cols-2 row-cols-lg-4 g-4 list-unstyled mb-5">' + WORKS.map((w, i) =>
      '<li class="col"><a class="card-link" href="#' + w.id + '" data-work="' + w.id + '" data-pos="' + (i + 1) + '">' + cover(w) +
      '<span class="d-block small text-secondary mt-3">' + w.kind + '</span><span class="line d-block">' + w.line + '</span></a></li>').join('') + '</ul>';
}

function audioBlock(w) {
  if (!w.audio) return '';
  return '<div class="audio-box my-3"><p class="small text-secondary mb-1">' + w.audio.label + '</p>' +
    '<audio controls preload="none" src="' + w.audio.src + '" data-audio="' + w.id + '">您的瀏覽器不支援音訊播放。</audio></div>';
}

function workView(w) {
  return '<a class="d-inline-block small text-secondary mt-4" href="#home">回到作品列表</a>' +
    '<article class="row g-4 g-md-5 py-4 mb-4"><div class="col-12 col-md-4 col-lg-3">' + cover(w, 'work-cover') + '</div>' +
    '<div class="col-12 col-md-8 col-lg-9">' +
    '<p class="small text-secondary mb-0">' + w.kind + '</p><h2 class="display-6 mt-1 mb-1">' + w.title + '</h2>' +
    audioBlock(w) +
    '<p class="serif fs-5 text-secondary mb-4">' + w.line + '</p>' +
    w.intro.map(p => '<p class="text-narrow">' + p + '</p>').join('') +
    '<div class="border-top mt-4 pt-3"><p class="small text-secondary mb-2">購買或試讀</p>' +
    w.links.map(l => '<a class="btn btn-outline-primary rounded-pill px-4 me-2 my-1" href="' + l[1] + '" target="_blank" rel="noopener" data-out="' + w.id + '">' + l[0] + '</a>').join('') +
    '</div></div></article>';
}

function statsView() {
  const views = log.filter(e => e.name === 'landing_view');
  const n = views.length;
  const cnt = (name, id) => log.filter(e => e.name === name && e.work_id === id).length;
  const rows = WORKS.map(w => ({w: w, c: cnt('select_work', w.id), o: cnt('outbound_click', w.id), a: cnt('audio_play', w.id)}));
  const totalC = rows.reduce((s, r) => s + r.c, 0), totalO = rows.reduce((s, r) => s + r.o, 0), totalA = rows.reduce((s, r) => s + r.a, 0);
  const src = {};
  views.forEach(e => { src[e.src] = (src[e.src] || 0) + 1; });
  const recent = log.slice(-6).reverse();
  const stat = (v, label) => '<div class="col-auto"><b class="serif d-block fs-3">' + v + '</b><span class="small text-secondary">' + label + '</span></div>';
  const li = (a, b) => '<li class="list-group-item d-flex justify-content-between gap-3 px-0 small"><span>' + a + '</span><span>' + b + '</span></li>';
  return '<a class="d-inline-block small text-secondary mt-4" href="#home">回到作品列表</a><section class="pt-3 pb-5">' +
    '<h2 class="h2 my-2">追蹤示範</h2><p class="text-secondary text-narrow">這一頁模擬分析後台。數字只來自你這個瀏覽器的點擊，正式上線後改由 GA4 或 Plausible 提供。</p>' +
    '<div class="row g-4 my-3">' + stat(n, '落地頁造訪') + stat(totalC, '作品點擊') + stat(totalO, '外部連結點擊') + stat(totalA, '音檔播放') + '</div>' +
    '<button class="btn btn-sm btn-pill me-2 mb-2" data-act="demo">載入示範數據</button><button class="btn btn-sm btn-pill mb-2" data-act="clear">清除數據</button>' +
    '<h3 class="h5 mt-4">各作品點擊率</h3><p class="text-secondary">點擊率 = 該作品點擊數 ÷ 落地頁造訪數</p>' +
    '<div class="table-responsive"><table class="table align-middle" style="min-width:520px"><thead><tr><th>作品</th><th>點擊</th><th>點擊率</th><th>外部連結</th><th>音檔播放</th></tr></thead><tbody>' +
    rows.map(r => {
      const p = n ? r.c / n : 0, pc = Math.min(100, p * 100);
      return '<tr><td>' + r.w.title + '</td><td>' + r.c + '</td><td>' + Math.round(p * 100) + '%<div class="progress mt-1" role="progressbar" aria-valuenow="' + Math.round(pc) + '" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar" style="width:' + pc + '%"></div></div></td><td>' + r.o + '</td><td>' + r.a + '</td></tr>';
    }).join('') + '</tbody></table></div>' +
    '<h3 class="h5 mt-4">掃描來源</h3><p class="text-secondary">來自網址中的 utm_source，例如 ?utm_source=poster</p><ul class="list-group list-group-flush">' +
    (Object.keys(src).length ? Object.keys(src).map(k => li(k, src[k])).join('') : li('尚無資料', '-')) + '</ul>' +
    '<h3 class="h5 mt-4">最近事件</h3><ul class="list-group list-group-flush">' +
    (recent.length ? recent.map(e => li(e.name + (e.work_id ? '（' + e.work_id + '）' : ''), new Date(e.t).toLocaleTimeString('zh-TW'))).join('') : li('尚無資料，回到列表點一本書試試', '-')) + '</ul>' +
    '<h3 class="h5 mt-4">接上正式追蹤</h3><p class="text-secondary text-narrow">把 track() 裡的註解換成你選的工具，事件名稱與參數可以直接沿用。</p>' +
    '<pre class="overflow-auto">gtag(\'event\', \'select_work\', { work_id: \'work-1\' });\nplausible(\'select_work\', { props: { work_id: \'work-1\' } });</pre></section>';
}

function route() {
  const h = location.hash.slice(1);
  const w = WORKS.find(x => x.id === h);
  app.innerHTML = w ? workView(w) : h === 'stats' ? statsView() : homeView();
  if (w) track('work_view', {work_id: w.id});
  else if (h !== 'stats' && !landed) { landed = true; track('landing_view', {content: CONTENT}); }
  window.scrollTo(0, 0);
}

function demo() {
  const S = ['poster', 'namecard', 'booth-A', 'flyer'], SW = [.4, .25, .2, .15], WW = [.38, .27, .2, .15];
  const pick = ws => { let r = Math.random(), i = 0; while (i < ws.length - 1 && r > ws[i]) { r -= ws[i]; i++; } return i; };
  for (let i = 0; i < 120; i++) {
    const s = S[pick(SW)], t = Date.now() - i * 60000;
    log.push({t: t, name: 'landing_view', src: s});
    if (Math.random() < .7) {
      const id = WORKS[pick(WW)].id;
      log.push({t: t + 5000, name: 'select_work', src: s, work_id: id});
      if (Math.random() < .35) log.push({t: t + 20000, name: 'outbound_click', src: s, work_id: id});
      if (Math.random() < .45) log.push({t: t + 12000, name: 'audio_play', src: s, work_id: id});
    }
  }
  try { localStorage.setItem(KEY, JSON.stringify(log.slice(-500))); } catch (e) {}
}

document.addEventListener('click', e => {
  const b = e.target.closest('button[data-act]');
  if (b) {
    if (b.dataset.act === 'demo') { demo(); route(); showToast('已載入示範數據'); }
    if (b.dataset.act === 'clear') clearModal().show();
    return;
  }
  const a = e.target.closest('a');
  if (!a) return;
  if (a.dataset.work) track('select_work', {work_id: a.dataset.work, pos: +a.dataset.pos});
  else if (a.dataset.out) track('outbound_click', {work_id: a.dataset.out, label: a.textContent});
});
document.getElementById('clearOk').addEventListener('click', () => {
  log = [];
  try { localStorage.removeItem(KEY); } catch (err) {}
  clearModal().hide();
  route();
  showToast('已清除數據');
});
// 音檔播放統計：play 事件不會冒泡，所以用 capture 監聽
// 只計「從頭開始播放」；暫停後繼續播放不重複計算
document.addEventListener('play', e => {
  const a = e.target;
  if (!a.matches || !a.matches('audio[data-audio]')) return;
  if (a.currentTime < 0.5) track('audio_play', {work_id: a.dataset.audio});
}, true);
window.addEventListener('hashchange', route);
route();

});
