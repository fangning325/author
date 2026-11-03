/**
 * 作家導覽頁 → Google Sheet 統計
 * 貼到「擴充功能 > Apps Script」，先執行一次 setup()，再部署為網頁應用程式。
 *
 * 會建立兩個工作表：
 *   log   ：每一次「進入作品頁」與「按下音檔播放」各記一列（原始紀錄）
 *   統計  ：用公式即時算出 work-1 ~ work-4 的頁面瀏覽次數與音檔播放次數
 */

// 作品清單：id 要和網頁 js/app.js 的 WORKS 一致
var WORKS = [
  ['work-1', '潮聲'],
  ['work-2', '夜行書店'],
  ['work-3', '舊城地圖'],
  ['work-4', '山語']
];
var EVENTS = ['work_view', 'audio_play'];   // 允許寫入的事件
var LOG = 'log';
var STATS = '統計';

// 接收網頁送來的事件
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var d = JSON.parse(e.postData.contents);
    var ids = WORKS.map(function (w) { return w[0]; });
    if (EVENTS.indexOf(d.event) < 0 || ids.indexOf(d.work_id) < 0) {
      return ContentService.createTextOutput('ignored');   // 擋掉不認得的資料
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(LOG) || setup().getSheetByName(LOG);
    sh.appendRow([
      Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss'),
      d.event,
      d.work_id,
      String(d.work_title || '').slice(0, 50),
      String(d.src || 'direct').slice(0, 50),
      String(d.content || '-').slice(0, 50),
      String(d.url || '').slice(0, 200)
    ]);
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}

// 用瀏覽器開網址可以測試部署是否成功
function doGet() {
  return ContentService.createTextOutput('tracking endpoint ready');
}

// 第一次使用請手動執行一次：建立 log 與 統計 工作表
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var log = ss.getSheetByName(LOG) || ss.insertSheet(LOG);
  if (log.getLastRow() === 0) {
    log.appendRow(['時間', '事件', '作品ID', '作品', '來源(utm_source)', '位置(utm_content)', '網址']);
    log.setFrozenRows(1);
    log.getRange('A1:G1').setFontWeight('bold');
    log.setColumnWidth(1, 150);
  }

  var st = ss.getSheetByName(STATS) || ss.insertSheet(STATS);
  st.clear();
  st.getRange('A1:E1').setValues([['作品ID', '作品', '頁面瀏覽次數', '音檔播放次數', '播放率（播放÷瀏覽）']]);
  WORKS.forEach(function (w, i) {
    var r = i + 2;
    st.getRange(r, 1, 1, 2).setValues([[w[0], w[1]]]);
    st.getRange(r, 3).setFormula('=COUNTIFS(log!$B:$B,"work_view",log!$C:$C,$A' + r + ')');
    st.getRange(r, 4).setFormula('=COUNTIFS(log!$B:$B,"audio_play",log!$C:$C,$A' + r + ')');
    st.getRange(r, 5).setFormula('=IF(C' + r + '=0,0,D' + r + '/C' + r + ')');
  });
  var t = WORKS.length + 2;
  st.getRange(t, 1).setValue('合計');
  st.getRange(t, 3).setFormula('=SUM(C2:C' + (t - 1) + ')');
  st.getRange(t, 4).setFormula('=SUM(D2:D' + (t - 1) + ')');
  st.getRange(t, 5).setFormula('=IF(C' + t + '=0,0,D' + t + '/C' + t + ')');
  st.getRange(2, 5, WORKS.length + 1, 1).setNumberFormat('0%');
  st.getRange('A1:E1').setFontWeight('bold');
  st.getRange(t, 1, 1, 5).setFontWeight('bold');

  // 依來源統計（QR code 的 utm_source）
  var s = t + 2;
  st.getRange(s, 1, 1, 3).setValues([['來源(utm_source)', '頁面瀏覽次數', '音檔播放次數']]).setFontWeight('bold');
  st.getRange(s + 1, 1).setFormula('=IFERROR(UNIQUE(FILTER(log!$E$2:$E,log!$B$2:$B="work_view")),"尚無資料")');
  st.getRange(s + 1, 2).setFormula('=ARRAYFORMULA(IF(A' + (s + 1) + ':A="","",COUNTIFS(log!$E:$E,A' + (s + 1) + ':A,log!$B:$B,"work_view")))');
  st.getRange(s + 1, 3).setFormula('=ARRAYFORMULA(IF(A' + (s + 1) + ':A="","",COUNTIFS(log!$E:$E,A' + (s + 1) + ':A,log!$B:$B,"audio_play")))');

  st.setColumnWidths(1, 5, 150);
  ss.setActiveSheet(st);
  return ss;
}
