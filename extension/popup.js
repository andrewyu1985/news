// Паттерн для Perplexity новостей (с www и без)
// Формат: /discover/{раздел}/{название} или /page/{название}
// Исключаем: /discover/you, /discover/finance и т.д. (просто ленты)
const PERPLEXITY_PATTERN = /^https:\/\/(www\.)?perplexity\.ai\/(discover\/[^\/]+\/.+|page\/.+)/;

// Найти все вкладки Perplexity
async function findPerplexityTabs() {
  const tabs = await chrome.tabs.query({});
  return tabs
    .filter(tab => tab.url && PERPLEXITY_PATTERN.test(tab.url))
    .sort((a, b) => (a.windowId - b.windowId) || (a.index - b.index));
}

// Извлечь текст со страницы
async function extractContent(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const extractTitle = () => {
          const h1 = document.querySelector('h1');
          if (h1 && h1.innerText.trim().length > 3) {
            return h1.innerText.trim();
          }

          const og = document.querySelector('meta[property="og:title"]');
          if (og && og.content) {
            return og.content.trim();
          }

          const rawTitle = (document.title || '').trim();
          if (!rawTitle) return '';
          const cleaned = rawTitle.replace(/\s*[-|]\s*Perplexity.*$/i, '').trim();
          return cleaned.toLowerCase() === 'perplexity' ? '' : cleaned;
        };

        const extractMainText = () => {
          // Ищем основной контент страницы Perplexity
          const selectors = [
            'article',
            '[class*="prose"]',
            '[class*="content"]',
            'main',
            '.markdown'
          ];

          for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el && el.innerText.trim().length > 100) {
              return el.innerText.trim();
            }
          }

          // Fallback: весь body без скриптов
          const body = document.body?.cloneNode(true);
          if (!body) return '';
          body.querySelectorAll('script, style, nav, header, footer').forEach(el => el.remove());
          return body.innerText.trim();
        };

        return {
          title: extractTitle(),
          content: extractMainText()
        };
      }
    });

    return results[0]?.result || { title: '', content: '' };
  } catch (error) {
    console.error('Error extracting content:', error);
    return { title: '', content: '' };
  }
}

// Форматировать дату для имени файла
function formatDate() {
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
}

// Собрать данные и сохранить
async function collectAndSave() {
  const button = document.getElementById('collect');
  const resultDiv = document.getElementById('result');

  button.disabled = true;
  button.textContent = 'Собираю...';
  resultDiv.style.display = 'none';

  try {
    const tabs = await findPerplexityTabs();

    if (tabs.length === 0) {
      throw new Error('Нет открытых вкладок Perplexity');
    }

    const items = [];
    const skipped = [];
    let duplicates = 0;
    const seen = new Set();

    for (let i = 0; i < tabs.length; i++) {
      button.textContent = `Обработка ${i + 1}/${tabs.length}...`;

      const tab = tabs[i];
      if (seen.has(tab.url)) {
        duplicates += 1;
        continue;
      }
      seen.add(tab.url);

      const { title, content } = await extractContent(tab.id);
      const cleanedContent = (content || '').trim();

      if (cleanedContent.length < 80) {
        skipped.push({ url: tab.url, reason: 'empty_or_too_short' });
        continue;
      }

      items.push({
        url: tab.url,
        title: title || tab.title || '',
        content: cleanedContent
      });
    }

    if (items.length === 0) {
      throw new Error('Не удалось извлечь контент. Проверьте, что новости открыты и полностью загрузились');
    }

    const data = {
      timestamp: new Date().toISOString(),
      count: items.length,
      items: items
    };
    if (skipped.length > 0) {
      data.skipped = skipped;
    }
    if (duplicates > 0) {
      data.duplicates = duplicates;
    }

    // Создаём и скачиваем файл
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const filename = `input_${formatDate()}.json`;

    try {
      await chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: false
      });
    } finally {
      URL.revokeObjectURL(url);
    }

    const extras = [];
    if (skipped.length > 0) {
      extras.push(`пропущено ${skipped.length} без текста`);
    }
    if (duplicates > 0) {
      extras.push(`дубликатов ${duplicates}`);
    }
    const extrasText = extras.length > 0 ? ` (${extras.join(', ')})` : '';

    resultDiv.className = 'result success';
    resultDiv.textContent = `Готово! Сохранено ${items.length} новостей в ${filename}${extrasText}`;
    resultDiv.style.display = 'block';

  } catch (error) {
    resultDiv.className = 'result error';
    resultDiv.textContent = `Ошибка: ${error.message}`;
    resultDiv.style.display = 'block';
  } finally {
    button.disabled = false;
    button.textContent = 'Собрать новости';
  }
}

// Обновить счётчик
async function updateTabsList() {
  const tabs = await findPerplexityTabs();
  const count = tabs.length;
  const countEl = document.getElementById('count');
  const warningEl = document.getElementById('warning');

  countEl.textContent = count;

  // Предупреждение если слишком много вкладок
  if (count > 15) {
    countEl.classList.add('warning');
    warningEl.textContent = `Многовато! Рекомендуется 10-12 новостей`;
    warningEl.style.display = 'block';
  } else if (count === 0) {
    warningEl.textContent = 'Откройте новости на perplexity.ai/discover/...';
    warningEl.style.display = 'block';
  } else {
    countEl.classList.remove('warning');
    warningEl.style.display = 'none';
  }
}

// Инициализация
document.getElementById('collect').addEventListener('click', collectAndSave);
updateTabsList();
