const SPREAD_SHEET = SpreadsheetApp.getActiveSpreadsheet();
const SHEET = SPREAD_SHEET.getSheetByName('楽天メール自動取得');

function fetchRakutenMailDetail() {
  /** メール検索クエリを作成 */
  const SUBJECT = 'カード利用のお知らせ(本人ご利用分) -速報版'; // 利用お知らせメールの件名
  const ADDRESS = 'info@mail.rakuten-card.co.jp'; // 楽天カードの明細メールアドレス

  // 今日のメールのみ取得
  let afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - 1);
  let beforeDate = new Date();
  beforeDate.setDate(beforeDate.getDate() + 1);
  const DATE_AFTER = Utilities.formatDate(afterDate, 'JST', 'yyyy/M/d');
  const DATE_BEFORE = Utilities.formatDate(beforeDate, 'JST', 'yyyy/M/d');

  const QUERY = 'subject:' + SUBJECT + ' from:' + ADDRESS + ' after:' + DATE_AFTER + ' before:' + DATE_BEFORE;

  // メール検索
  threads = GmailApp.search(QUERY);
  if(threads.length > 0) {
    const msgs = GmailApp.getMessagesForThreads(threads);
    msgs.forEach((msg) => {
      let lastrow = SHEET.getLastRow(); // 最終行番号
      let newrow = lastrow + 1 // 新規で追加する行番号
      let plainBody = msg[0].getPlainBody(); // メール本文
      let mailDate = msg[0].getDate(); // メール受信日時

      // mailDateが既存シートに含まれるなら続行
      let existingMailDate = SHEET.getRange(2, 1, lastrow, 1).getValues();
      // Date型でincludeがtrue判定にならなかったから、わざわざgetTimeで比較しています
      if (!existingMailDate.some(row => row.map(x => new Date(x).getTime()).includes(mailDate.getTime()))) {
        // 利用明細の箇所を抽出
        const singleDetailRegexp = /■利用日:\s(?<date>.+)\r\n■利用先:\s(?<store>.+)\r\n■利用者:\s(?<payer>.+)\r\n■支払方法:\s(?<method>.+)\r\n■利用金額:\s(?<price>.+)\s円\r\n■支払月:\s(?<payment_month>.+)/;
        let singleDetail = singleDetailRegexp.exec(plainBody);
        while (true) {
          let singleDetail = singleDetailRegexp.exec(plainBody);
          if (!singleDetail) {
            break;
          }
          SHEET.getRange(`A${newrow}`).setValue(mailDate);
          SHEET.getRange(`B${newrow}`).setValue(singleDetail['groups']['date']);;
          SHEET.getRange(`C${newrow}`).setValue(singleDetail['groups']['store']);
          SHEET.getRange(`D${newrow}`).setValue(singleDetail['groups']['payer']);
          SHEET.getRange(`E${newrow}`).setValue(singleDetail['groups']['method']);
          SHEET.getRange(`F${newrow}`).setValue(singleDetail['groups']['price']);
          SHEET.getRange(`G${newrow}`).setValue(singleDetail['groups']['payment_month']);

          newrow++;
          // 抽出完了した文字列は本文から削除して再利用
          plainBody = plainBody.replace(singleDetail[0], '');
        };
      }
    });
  }

  // 利用日で降順ソート
  const rangeToSort = SHEET.getRange(2, 1, SHEET.getLastRow(), 7);
  rangeToSort.sort({column: 2, ascending: false});
}