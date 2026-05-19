const VPASS_GMAIL_QUERY_BASE =
  'from:statement@vpass.ne.jp (subject:"ご利用のお知らせ" OR subject:"ご利用明細のお知らせ")';
const PROCESSED_IDS_KEY = 'processedVpassMessageIds';
const MAX_STORED_IDS = 200;
const MULTI_TX_NOTIFY_INTERVAL_MS = 2000;

/** newer_than は GmailApp で動作しないため after:YYYY/MM/DD で昨日以降に絞ったクエリを生成する。 */
function buildVpassQuery(): string {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const y = yesterday.getFullYear();
  const m = String(yesterday.getMonth() + 1).padStart(2, '0');
  const d = String(yesterday.getDate()).padStart(2, '0');
  return `${VPASS_GMAIL_QUERY_BASE} after:${y}/${m}/${d}`;
}

interface VpassTransaction {
  date: string;
  store: string;
  category: string;
  amount: string;
}

/**
 * Vpassの利用通知メールを検索し、未処理のものをパースして Discord に通知する。
 * 重複送信防止のため処理済みメッセージIDを ScriptProperties に保持する。
 * 時刻フィルタは GmailApp.search が newer_than を正しく解釈しないためコード側で実施。
 * トリガーの多重起動によるレースコンディションを LockService で防ぐ。
 */
function checkVpassEmails(): void {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(0)) return;

  try {
    const props = PropertiesService.getScriptProperties();
    const webhookUrl = props.getProperty('DISCORD_WEBHOOK_URL');
    const threadId = props.getProperty('DISCORD_THREAD_ID') ?? undefined;

    if (!webhookUrl) {
      console.error('DISCORD_WEBHOOK_URL is not set in Script Properties');
      return;
    }

    const processedIds = getProcessedVpassIds();
    const threads = GmailApp.search(buildVpassQuery());
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let updated = false;

    for (const thread of threads) {
      for (const message of thread.getMessages()) {
        if (message.getDate() < oneDayAgo) continue;
        const id = message.getId();
        if (processedIds.has(id)) continue;

        const body = message.getPlainBody();
        const txs = parseVpassMessage(message.getSubject(), body);
        for (let i = 0; i < txs.length; i++) {
          if (i > 0) Utilities.sleep(MULTI_TX_NOTIFY_INTERVAL_MS);
          const tx = txs[i];
          postToDiscord(webhookUrl, `${tx.date} ${tx.store} ${tx.category}(自動送信) ${tx.amount}`, threadId);
        }

        processedIds.add(id);
        updated = true;
      }
    }

    if (updated) {
      saveProcessedVpassIds(processedIds);
    }
  } finally {
    lock.releaseLock();
  }
}

/** Vpassメール本文から利用日・利用先・取引種別・金額を抽出する。パース失敗時は null を返す。 */
function parseVpassEmail(body: string): VpassTransaction | null {
  const dateMatch = body.match(/◇利用日[：:]\s*(\d{4}\/\d{2}\/\d{2})/);
  const storeMatch = body.match(/◇利用先[：:]\s*([^／\n]+)/);
  const categoryMatch = body.match(/◇利用取引[：:]\s*(.+)/);
  const amountMatch = body.match(/◇利用金額[：:]\s*([\d,]+)円/);

  if (!dateMatch || !storeMatch || !categoryMatch || !amountMatch) return null;

  return {
    date: dateMatch[1],
    store: storeMatch[1].trim(),
    category: categoryMatch[1].trim(),
    amount: amountMatch[1].replace(/,/g, ''),
  };
}

/**
 * Vpassメール本文に含まれる全ての利用明細を抽出する。
 * 1通のメールに複数件の速報明細が載るケースに対応するため、◇利用日 をブロック区切りとして分割して各ブロックをパースする。
 */
function parseVpassEmails(body: string): VpassTransaction[] {
  const blocks = body.split(/(?=◇利用日[：:])/);
  const results: VpassTransaction[] = [];
  for (const block of blocks) {
    const tx = parseVpassEmail(block);
    if (tx) results.push(tx);
  }
  return results;
}

/**
 * 件名に応じて適切なパース方式を選択する。
 * 「ご利用明細のお知らせ」は1通に複数件含まれ得るため分割パース、
 * 「ご利用のお知らせ」は単一明細前提でブロック分割を行わない（本文中の引用やフッターによる重複抽出を防ぐ）。
 */
function parseVpassMessage(subject: string, body: string): VpassTransaction[] {
  if (subject.includes('ご利用明細のお知らせ')) {
    return parseVpassEmails(body);
  }
  const tx = parseVpassEmail(body);
  return tx ? [tx] : [];
}

/** ScriptProperties から処理済みメッセージIDのセットを取得する。 */
function getProcessedVpassIds(): Set<string> {
  const stored = PropertiesService.getScriptProperties().getProperty(PROCESSED_IDS_KEY);
  if (!stored) return new Set<string>();
  return new Set<string>(stored.split(',').filter((id) => id.length > 0));
}

/** 処理済みメッセージIDを ScriptProperties に保存する。上限を超えた分は古い順に切り捨てる。 */
function saveProcessedVpassIds(ids: Set<string>): void {
  const trimmed = Array.from(ids).slice(-MAX_STORED_IDS);
  PropertiesService.getScriptProperties().setProperty(PROCESSED_IDS_KEY, trimmed.join(','));
}

/** checkVpassEmails を1分ごとに実行するトリガーを登録する。既存トリガーは事前に削除する。 */
function setupVpassTrigger(): void {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'checkVpassEmails')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('checkVpassEmails').timeBased().everyMinutes(1).create();
  console.log('Trigger created: checkVpassEmails every 1 minute');
}

/** checkVpassEmails のトリガーをすべて削除する。 */
function removeVpassTrigger(): void {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'checkVpassEmails')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  console.log('Trigger removed');
}

/** 検索クエリで見つかったメールの一覧と processedIds の状態をログ出力する。 */
function diagnoseVpassEmails(): void {
  const processedIds = getProcessedVpassIds();
  console.log('=== processedIds ===');
  console.log(JSON.stringify(Array.from(processedIds)));

  const threads = GmailApp.search(buildVpassQuery());
  console.log(`=== 検索結果: ${threads.length} スレッド ===`);

  for (const thread of threads) {
    for (const message of thread.getMessages()) {
      const id = message.getId();
      const date = message.getDate().toISOString();
      const skipped = processedIds.has(id);
      console.log(`id: ${id} / date: ${date} / skipped: ${skipped}`);
    }
  }
}

/** processedIds をリセットする。次回 checkVpassEmails 実行時に過去24時間のメールが再通知される。 */
function clearProcessedVpassIds(): void {
  PropertiesService.getScriptProperties().deleteProperty(PROCESSED_IDS_KEY);
  console.log('processedIds をクリアしました');
}

/** 最新のVpassメールをパースして Discord に送信する疎通確認用関数。processedIds は更新しない。 */
function testVpassNotification(): void {
  const props = PropertiesService.getScriptProperties();
  const webhookUrl = props.getProperty('DISCORD_WEBHOOK_URL');
  const threadId = props.getProperty('DISCORD_THREAD_ID') ?? undefined;

  if (!webhookUrl) {
    console.error('DISCORD_WEBHOOK_URL is not set in Script Properties');
    return;
  }

  const threads = GmailApp.search(buildVpassQuery());
  if (threads.length === 0) {
    console.log('メールが見つかりません');
    return;
  }

  const message = threads[0].getMessages()[0];
  const txs = parseVpassMessage(message.getSubject(), message.getPlainBody());
  if (txs.length === 0) {
    console.error('パース失敗');
    return;
  }

  for (let i = 0; i < txs.length; i++) {
    if (i > 0) Utilities.sleep(MULTI_TX_NOTIFY_INTERVAL_MS);
    const tx = txs[i];
    const content = `${tx.date} ${tx.store} ${tx.category} ${tx.amount}`;
    console.log('送信内容:', content);
    postToDiscord(webhookUrl, content, threadId);
  }
  console.log(`Discord送信完了 (${txs.length}件)`);
}
