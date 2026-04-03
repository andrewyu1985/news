/**
 * Telegram publisher.
 * Sends content to a Telegram chat/channel via Bot API.
 */
export async function publishToTelegram(botToken, chatId, content) {
  if (!botToken || !chatId) {
    console.error('[telegram] Missing botToken or chatId');
    return null;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: content,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('[telegram] API error:', data.description || JSON.stringify(data));
      return null;
    }

    return { messageId: data.result.message_id };
  } catch (err) {
    console.error('[telegram] Error publishing:', err.message);
    return null;
  }
}
