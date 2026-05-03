interface Transaction {
  date: string;
  store: string;
  category: string;
  amount: string;
}

const GMAIL_QUERY =
  'from:statement@vpass.ne.jp subject:ご利用明細のお知らせ newer_than:1d';
const PROCESSED_IDS_KEY = 'processedMessageIds';
const MAX_STORED_IDS = 200;

function checkNewEmails(): void {
  const webhookUrl =
    PropertiesService.getScriptProperties().getProperty('DISCORD_WEBHOOK_URL');
  if (!webhookUrl) {
    console.error('DISCORD_WEBHOOK_URL is not set in Script Properties');
    return;
  }

  const processedIds = getProcessedIds();
  const threads = GmailApp.search(GMAIL_QUERY);
  let updated = false;

  for (const thread of threads) {
    for (const message of thread.getMessages()) {
      const id = message.getId();
      if (processedIds.has(id)) continue;

      const body = message.getPlainBody();
      const tx = parseSmfcEmail(body);
      if (tx) {
        sendToDiscord(webhookUrl, tx);
      }

      processedIds.add(id);
      updated = true;
    }
  }

  if (updated) {
    saveProcessedIds(processedIds);
  }
}

function parseSmfcEmail(body: string): Transaction | null {
  // ご利用日時：2026/04/28
  const dateMatch = body.match(/ご利用日時[：:]\s*(\d{4}\/\d{2}\/\d{2})/);
  // 店名／支払方法（内容）\t金額円
  // 例: キャンドゥ新高円寺店／ｉＤ（買物）\t330円
  const txMatch = body.match(/^(.+?)／.+?（(.+?)）\s+([\d,]+)円/m);

  if (!dateMatch || !txMatch) return null;

  return {
    date: dateMatch[1],
    store: txMatch[1].trim(),
    category: txMatch[2].trim(),
    amount: txMatch[3].replace(/,/g, ''),
  };
}

function sendToDiscord(webhookUrl: string, tx: Transaction): void {
  const content = `${tx.date} ${tx.store} ${tx.category} ${tx.amount}`;

  UrlFetchApp.fetch(webhookUrl, {
    method: 'post' as GoogleAppsScript.URL_Fetch.HttpMethod,
    contentType: 'application/json',
    payload: JSON.stringify({ content }),
    muteHttpExceptions: true,
  });
}

function getProcessedIds(): Set<string> {
  const stored =
    PropertiesService.getScriptProperties().getProperty(PROCESSED_IDS_KEY);
  if (!stored) return new Set<string>();
  return new Set<string>(stored.split(',').filter((id) => id.length > 0));
}

function saveProcessedIds(ids: Set<string>): void {
  const trimmed = Array.from(ids).slice(-MAX_STORED_IDS);
  PropertiesService.getScriptProperties().setProperty(
    PROCESSED_IDS_KEY,
    trimmed.join(',')
  );
}

function setupTrigger(): void {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'checkNewEmails')
    .forEach((t) => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('checkNewEmails').timeBased().everyMinutes(1).create();
  console.log('Trigger created: checkNewEmails every 1 minute');
}

function removeTrigger(): void {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'checkNewEmails')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  console.log('Trigger removed');
}
