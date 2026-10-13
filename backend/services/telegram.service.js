async function sendMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      },
    );

    if (!response.ok) {
      console.error(`Telegram answered with status ${response.status}`);
    }
    return response.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export const telegramService = { sendMessage };
