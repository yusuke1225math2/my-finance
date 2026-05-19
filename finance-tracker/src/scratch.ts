/**
 * 一次処理・アドホック実行用のスクラッチファイル。
 * GASエディタから引数を渡せないため、関数内の定数を直接書き換えて実行する。
 * ここに書いた処理は永続的な運用フローに組み込まないこと。
 */

/**
 * 直近のVpassメールを一覧表示する。出力された messageId を控えて
 * `scratchRemoveProcessedVpassIdById` の TARGET_MESSAGE_ID に貼り付けて使う。
 * Gmail URL末尾の `FMfcg...` 形式はGmail APIで扱えないため、このIDを使う必要がある。
 */
function scratchListRecentVpassIds(): void {
  const threads = GmailApp.search(VPASS_GMAIL_QUERY_BASE, 0, 20);
  const processedIds = getProcessedVpassIds();
  console.log(`=== 直近のVpassメール (${threads.length} スレッド) ===`);
  for (const thread of threads) {
    for (const message of thread.getMessages()) {
      const id = message.getId();
      const date = Utilities.formatDate(message.getDate(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm');
      const processed = processedIds.has(id) ? '[済]' : '[未]';
      const txs = parseVpassEmails(message.getPlainBody());
      const notifyLines =
        txs.length === 0
          ? ['(パース失敗)']
          : txs.map((tx) => `  -> ${tx.date} ${tx.store} ${tx.category} ${tx.amount}`);
      console.log(`${processed} ${date} ${id}`);
      for (const line of notifyLines) console.log(line);
    }
  }
}

/**
 * 指定したメッセージIDを processedIds から削除する。
 * 下の TARGET_MESSAGE_ID を `scratchListRecentVpassIds` の出力から書き換えて実行する。
 * 同じスレッド内の他メッセージは削除しない（ID単位で厳密に1件のみ）。
 */
function scratchRemoveProcessedVpassIdById(): void {
  const TARGET_MESSAGE_ID = 'ここにmessageIdを貼り付け';

  const processedIds = getProcessedVpassIds();
  if (!processedIds.has(TARGET_MESSAGE_ID)) {
    console.log(`messageId=${TARGET_MESSAGE_ID} は processedIds に存在しません`);
    return;
  }
  processedIds.delete(TARGET_MESSAGE_ID);
  saveProcessedVpassIds(processedIds);
  console.log(`削除: ${TARGET_MESSAGE_ID}`);
}
