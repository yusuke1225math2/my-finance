interface Transaction {
  date: string;
  store: string;
  category: string;
  amount: string;
}

const GMAIL_QUERY =
  'from:(mail@contact.vpass.ne.jp OR statement@vpass.ne.jp) subject:ご利用のお知らせ newer_than:1d';
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

function extractField(body: string, fieldName: string): string | null {
  // Pattern 1: "◇fieldName：value" or "◇fieldName:value" on same line
  let m = body.match(new RegExp(`◇${fieldName}[：:]\\s*(.+?)(?:\\r?\\n|$)`));
  if (m) return m[1].trim();
  // Pattern 2: "◇fieldName\nvalue" on next line
  m = body.match(new RegExp(`◇${fieldName}\\r?\\n(.+?)(?:\\r?\\n|$)`));
  if (m) return m[1].trim();
  return null;
}

function parseSmfcEmail(body: string): Transaction | null {
  const date = extractField(body, '利用日');
  const store = extractField(body, 'ご利用先店名');
  const category = extractField(body, '利用取引');
  const amount = extractField(body, '利用金額');

  if (!date || !store || !amount) return null;

  return {
    date,
    store,
    category: category ?? '不明',
    amount,
  };
}

function sendToDiscord(webhookUrl: string, tx: Transaction): void {
  const content = [
    '💳 **クレカ利用速報**',
    `📅 日付: ${tx.date}`,
    `🏪 支出場所: ${tx.store}`,
    `📝 内容: ${tx.category}`,
    `💰 金額: ${tx.amount}`,
  ].join('\n');

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
