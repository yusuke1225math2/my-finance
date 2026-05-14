const VPASS_GMAIL_QUERY = 'from:statement@vpass.ne.jp subject:ご利用明細のお知らせ newer_than:1d';
const PROCESSED_IDS_KEY = 'processedVpassMessageIds';
const MAX_STORED_IDS = 200;

interface VpassTransaction {
  date: string;
  store: string;
  category: string;
  amount: string;
}

function checkVpassEmails(): void {
  const props = PropertiesService.getScriptProperties();
  const webhookUrl = props.getProperty('DISCORD_WEBHOOK_URL');
  const threadId = props.getProperty('DISCORD_THREAD_ID') ?? undefined;

  if (!webhookUrl) {
    console.error('DISCORD_WEBHOOK_URL is not set in Script Properties');
    return;
  }

  const processedIds = getProcessedVpassIds();
  const threads = GmailApp.search(VPASS_GMAIL_QUERY);
  let updated = false;

  for (const thread of threads) {
    for (const message of thread.getMessages()) {
      const id = message.getId();
      if (processedIds.has(id)) continue;

      const body = message.getPlainBody();
      const tx = parseVpassEmail(body);
      if (tx) {
        postToDiscord(webhookUrl, `${tx.date} ${tx.store} ${tx.category} ${tx.amount}`, threadId);
      }

      processedIds.add(id);
      updated = true;
    }
  }

  if (updated) {
    saveProcessedVpassIds(processedIds);
  }
}

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

function getProcessedVpassIds(): Set<string> {
  const stored = PropertiesService.getScriptProperties().getProperty(PROCESSED_IDS_KEY);
  if (!stored) return new Set<string>();
  return new Set<string>(stored.split(',').filter((id) => id.length > 0));
}

function saveProcessedVpassIds(ids: Set<string>): void {
  const trimmed = Array.from(ids).slice(-MAX_STORED_IDS);
  PropertiesService.getScriptProperties().setProperty(PROCESSED_IDS_KEY, trimmed.join(','));
}

function setupVpassTrigger(): void {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'checkVpassEmails')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('checkVpassEmails').timeBased().everyMinutes(1).create();
  console.log('Trigger created: checkVpassEmails every 1 minute');
}

function removeVpassTrigger(): void {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'checkVpassEmails')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  console.log('Trigger removed');
}

function debugVpassEmail(): void {
  const query = 'from:statement@vpass.ne.jp subject:ご利用明細のお知らせ';
  const threads = GmailApp.search(query);
  if (threads.length === 0) {
    console.log('メールが見つかりません');
    return;
  }
  const message = threads[0].getMessages()[0];
  console.log('=== Plain Body ===');
  console.log(message.getPlainBody());
  console.log('=== Parse Result ===');
  console.log(JSON.stringify(parseVpassEmail(message.getPlainBody())));
}

function testVpassNotification(): void {
  const props = PropertiesService.getScriptProperties();
  const webhookUrl = props.getProperty('DISCORD_WEBHOOK_URL');
  const threadId = props.getProperty('DISCORD_THREAD_ID') ?? undefined;

  if (!webhookUrl) {
    console.error('DISCORD_WEBHOOK_URL is not set in Script Properties');
    return;
  }

  const query = 'from:statement@vpass.ne.jp subject:ご利用明細のお知らせ';
  const threads = GmailApp.search(query);
  if (threads.length === 0) {
    console.log('メールが見つかりません');
    return;
  }

  const message = threads[0].getMessages()[0];
  const tx = parseVpassEmail(message.getPlainBody());
  if (!tx) {
    console.error('パース失敗');
    return;
  }

  const content = `${tx.date} ${tx.store} ${tx.category} ${tx.amount}`;
  console.log('送信内容:', content);
  postToDiscord(webhookUrl, content, threadId);
  console.log('Discord送信完了');
}
