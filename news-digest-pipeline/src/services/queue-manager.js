import { getArticleCount, getNewArticles, getDigest, getDb } from '../db/index.js';
import { generateDigest } from './digest-generator.js';
import { notifyDigestReady } from './notifier.js';

/**
 * Send generated digest to preview chat for review before publishing.
 */
async function sendPreviewToTelegram(config, digestId) {
  const previewChatId = config.telegramPreviewChatId;
  if (!previewChatId || !config.telegramBotToken) return;

  const digest = getDigest(digestId);
  if (!digest || !digest.content) return;

  const MAX_LEN = 4000;
  const text = digest.content;
  const chunks = [];
  for (let i = 0; i < text.length; i += MAX_LEN) {
    chunks.push(text.slice(i, i + MAX_LEN));
  }

  const escHtml = (str) => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const artCount = digest.articles_count || '?';
  const header = '<b>Дайджест готов к проверке (' + artCount + ' статей)</b>
' +
    'ID: <code>' + escHtml(digestId) + '</code>
' +
    'Проверьте и опубликуйте через дашборд.';

  const apiUrl = 'https://api.telegram.org/bot' + config.telegramBotToken + '/sendMessage';
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const send = async (msg) => {
    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: previewChatId,
        text: msg,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    if (!resp.ok) {
      const body = await resp.text();
      console.error('[queue-manager] Preview send failed: ' + resp.status + ' ' + body);
    }
  };

  await send(header);
  for (const chunk of chunks) {
    await sleep(1100); // respect Telegram rate limit: 1 msg/sec per chat
    await send(chunk);
  }

  console.log('[queue-manager] Preview sent to chat ' + previewChatId);
}

let running = false;

async function processQueue(config) {
  if (running) {
    return;
  }

  running = true;

  try {
    const newCount = getArticleCount('new');

    if (newCount < config.articleThreshold) {
      return;
    }

    const limit = Math.min(newCount, config.maxArticlesPerDigest);
    const articles = getNewArticles(limit);

    console.log(`[queue-manager] Processing ${articles.length} articles into digest`);

    const db = getDb();
    const digestId = await generateDigest(db, articles, config);

    console.log(`[queue-manager] Digest generated: ${digestId}`);

    // Send preview to Telegram for review before publishing
    await sendPreviewToTelegram(config, digestId);

    if (config.ntfyTopic) {
      const digest = getDigest(digestId);
      await notifyDigestReady(config.ntfyTopic, digest);
    }
  } catch (err) {
    console.error('[queue-manager] Error processing queue:', err.message);
  } finally {
    running = false;
  }
}

export function startQueueManager(config) {
  console.log(`[queue-manager] Started (interval: ${config.checkIntervalMs}ms, threshold: ${config.articleThreshold})`);

  const intervalId = setInterval(() => processQueue(config), config.checkIntervalMs);

  // Run once immediately
  processQueue(config);

  return intervalId;
}
