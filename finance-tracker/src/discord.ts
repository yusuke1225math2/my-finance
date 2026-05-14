/** Discord Webhook にメッセージを送信する。threadId を指定するとスレッドに投稿される。 */
function postToDiscord(webhookUrl: string, content: string, threadId?: string): void {
  const url = threadId ? `${webhookUrl}?thread_id=${threadId}` : webhookUrl;
  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ content, tts: false }),
    muteHttpExceptions: true,
  });
  const code = response.getResponseCode();
  if (code !== 204) {
    const retryAfter = (response.getHeaders() as Record<string, string>)['Retry-After'];
    const body = response.getContentText();
    console.error(`Discord API Error: ${code} / Retry-After: ${retryAfter} / body: ${body}`);
    throw new Error(`Discord API Error: ${code}`);
  }
}
