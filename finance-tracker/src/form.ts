/**
 * Googleフォームに出費が送信されたときのトリガー関数。
 * スプレッドシートの新規行から日付・場所・項目・金額を読み取り Discord に通知する。
 * 列順: A=タイムスタンプ, B=日付, C=場所, D=項目, E=金額
 */
function onExpenseFormSubmit(e: GoogleAppsScript.Events.SheetsOnFormSubmit): void {
  const props = PropertiesService.getScriptProperties();
  const webhookUrl = props.getProperty('DISCORD_WEBHOOK_URL');
  const threadId = props.getProperty('DISCORD_THREAD_ID') ?? undefined;

  if (!webhookUrl) {
    console.error('DISCORD_WEBHOOK_URL is not set in Script Properties');
    return;
  }

  const values = e.range.getValues()[0];
  const rawDate = values[1] as Date | string;
  const location = values[2] as string;
  const item = values[3] as string;
  const amount = values[4] as string | number;

  let date: string;
  if (rawDate instanceof Date) {
    const year = rawDate.getFullYear();
    const month = String(rawDate.getMonth() + 1).padStart(2, '0');
    const day = String(rawDate.getDate()).padStart(2, '0');
    date = `${year}/${month}/${day}`;
  } else {
    date = rawDate;
  }

  postToDiscord(webhookUrl, `${date} ${location} ${item} ${amount}`, threadId);
}

/** Discord 送信の疎通確認用。固定のテストメッセージを送信する。 */
function testDiscordMessage(): void {
  const props = PropertiesService.getScriptProperties();
  const webhookUrl = props.getProperty('DISCORD_WEBHOOK_URL');
  const threadId = props.getProperty('DISCORD_THREAD_ID') ?? undefined;
  if (!webhookUrl) {
    console.error('DISCORD_WEBHOOK_URL is not set in Script Properties');
    return;
  }
  postToDiscord(webhookUrl, '2024/01/15 東京オフィス 文房具 1500', threadId);
}
