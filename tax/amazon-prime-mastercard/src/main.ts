/**
 * スプレッドシートを開いたときに自動で実行される関数
 * 上部メニューに専用のボタンを追加します
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('★自動処理メニュー') // メニュー名
      .addItem('個人支出自動挿入', 'updateRawDataSheet') // 項目名と実行する関数名
      .addSeparator()
      .addItem('Excelエクスポート', 'showExportDialog')
      .addSeparator()
      .addItem('リセット', 'clearRawDataExceptA1')
      .addToUi();
}

/**
 * 手順1: rawDataシートのC列を「個人項目」のワードでチェックし、A列に記号を挿入します
 */
function updateRawDataSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rawDataSheet = ss.getSheetByName('rawData');
  const itemsSheet = ss.getSheetByName('個人項目');

  if (!rawDataSheet || !itemsSheet) return;

  const itemsData = itemsSheet.getRange(2, 1, itemsSheet.getLastRow() - 1, 2).getValues();
  const fullBurdenWords = itemsData.map(row => row[0]).filter(word => word !== "");
  const halfBurdenWords = itemsData.map(row => row[1]).filter(word => word !== "");

  const lastRow = rawDataSheet.getLastRow();
  if (lastRow < 2) return;

  const rawDataRange = rawDataSheet.getRange(2, 1, lastRow - 1, 3);
  const rawDataValues = rawDataRange.getValues();

  const updatedAColumn = rawDataValues.map(row => {
    const content = row[2] || "";
    if (fullBurdenWords.some(word => content.includes(word))) return ["◯"];
    if (halfBurdenWords.some(word => content.includes(word))) return ["△"];
    return [row[0]];
  });

  rawDataSheet.getRange(2, 1, updatedAColumn.length, 1).setValues(updatedAColumn);
  SpreadsheetApp.flush();
}

/**
 * エクスポート用のカスタムダイアログを表示します
 */
function showExportDialog() {
  const now = new Date();
  const defaultYear = Utilities.formatDate(now, "JST", "yyyy");
  const defaultMonth = Utilities.formatDate(now, "JST", "MM");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body { font-family: sans-serif; padding: 20px; font-size: 14px; }
          .group { margin-bottom: 15px; }
          label { display: block; margin-bottom: 5px; font-weight: bold; }
          input { width: 100%; padding: 8px; box-sizing: border-box; }
          .btn-area { margin-top: 20px; text-align: right; }
          button { padding: 10px 20px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc; margin-left: 10px; }
          .ok { background: #1a73e8; color: white; border: none; }
        </style>
      </head>
      <body>
        <div class="group">
          <label>支払年を入力してください</label>
          <input type="number" id="year" value="${defaultYear}">
        </div>
        <div class="group">
          <label>支払月を入れてください</label>
          <input type="number" id="month" value="${parseInt(defaultMonth)}">
        </div>
        <div class="btn-area">
          <button onclick="google.script.host.close()">キャンセル</button>
          <button class="ok" onclick="runExport()">OK</button>
        </div>
        <script>
          function runExport() {
            const y = document.getElementById('year').value;
            let m = document.getElementById('month').value;
            if (m.length === 1) m = '0' + m;
            // GAS側の関数を呼び出す
            google.script.run
              .withSuccessHandler(() => google.script.host.close())
              .exportRawDataToExcel(y, m);
          }
        </script>
      </body>
    </html>
  `;

  const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(350)
    .setHeight(280);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'エクスポート設定');
}

/**
 * 手順2: 実際のデータ抽出とExcel出力
 */
function exportRawDataToExcel(year: string, month: string) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rawDataSheet = ss.getSheetByName('rawData');
  if (!rawDataSheet) return;

  const fileName = "AmazonPrimeMastercard" + year + month;
  const tempSS = SpreadsheetApp.create(fileName);
  const tempSSId = tempSS.getId();

  rawDataSheet.copyTo(tempSS).setName('rawData');
  tempSS.deleteSheet(tempSS.getSheets()[0]);
  SpreadsheetApp.flush();

  const url = "https://docs.google.com/spreadsheets/d/" + tempSSId + "/export?format=xlsx";
  const token = ScriptApp.getOAuthToken();
  const response = UrlFetchApp.fetch(url, {
    headers: { 'Authorization': 'Bearer ' + token },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() === 200) {
    const blob = response.getBlob().setName(fileName + ".xlsx");
    DriveApp.createFile(blob);
    SpreadsheetApp.getUi().alert("Googleドライブに保存しました。\nファイル名: " + fileName + ".xlsx");
  }
  DriveApp.getFileById(tempSSId).setTrashed(true);
}

/**
 * 「rawData」シートのA1セル以外の値をすべてクリアする
 */
function clearRawDataExceptA1() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("rawData");

  if (!sheet) {
    console.error("シート 'rawData' が見つかりません。");
    return;
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  // 1. 1行目のB列以降をクリア
  if (lastCol > 1) {
    sheet.getRange(1, 2, 1, lastCol - 1).clearContent();
  }

  // 2. 2行目以降のすべてのセルをクリア
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }
}
