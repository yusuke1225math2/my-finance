const SPREAD_SHEET = SpreadsheetApp.getActiveSpreadsheet();
const SHEET = SPREAD_SHEET.getSheetByName('楽天メール自動取得');

function fetchRakutenMailDetail() {
  // Gmail検索
  const SUBJECT = 'カード利用のお知らせ(本人ご利用分) -速報版'; // 利用お知らせメールの件名
  const ADDRESS = 'info@mail.rakuten-card.co.jp'; // 楽天カードの明細メールアドレス

  // 1週間前まで遡ってメール取得
  let afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - 7);
  let beforeDate = new Date();
  beforeDate.setDate(beforeDate.getDate() + 1);
  const DATE_AFTER = Utilities.formatDate(afterDate, 'JST', 'yyyy/M/d');
  const DATE_BEFORE = Utilities.formatDate(beforeDate, 'JST', 'yyyy/M/d');

  // Gmail取得
  const QUERY = 'subject:' + SUBJECT + ' from:' + ADDRESS + ' after:' + DATE_AFTER + ' before:' + DATE_BEFORE;
  threads = GmailApp.search(QUERY);

  if(threads.length > 0) {
    const msgs = GmailApp.getMessagesForThreads(threads);
    msgs.forEach((msg) => {
      let lastRow = SHEET.getRange("A:A").getValues().findLastIndex(row => row[0] !== '') + 1;
      let newRow = lastRow + 1
      let plainBody = msg[0].getPlainBody(); // メール本文
      let mailDate = msg[0].getDate(); // メール受信日時

      // mailDateの重複チェック
      let existingMailDate = SHEET.getRange(2, 1, lastRow, 1).getValues();

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
          SHEET.getRange(`A${newRow}`).setValue(mailDate);
          SHEET.getRange(`B${newRow}`).setValue(singleDetail['groups']['date']);;
          SHEET.getRange(`C${newRow}`).setValue(singleDetail['groups']['store']);
          SHEET.getRange(`D${newRow}`).setValue(singleDetail['groups']['payer']);
          SHEET.getRange(`E${newRow}`).setValue(singleDetail['groups']['method']);
          SHEET.getRange(`F${newRow}`).setValue(singleDetail['groups']['price']);
          SHEET.getRange(`G${newRow}`).setValue(singleDetail['groups']['payment_month']);

          newRow++;
          plainBody = plainBody.replace(singleDetail[0], ''); // 抽出完了した文字列は本文から削除して再利用
        };
      }
    });
  }

  // 利用日で降順ソート
  lastRow = SHEET.getRange("A:A").getValues().findLastIndex(row => row[0] !== '') + 1;
  const rangeToSort = SHEET.getRange(2, 1, lastRow, 20); // TODO: 20は適当なのでシートの右端まで取得するように変更する
  rangeToSort.sort({column: 2, ascending: false});
}
