# News Digest Pipeline

[Пример готового дайджеста в Facebook](https://www.facebook.com/alex.v.krol/posts/pfbid02oj14ZFeSvyrrpcNN8dBJoJ6YsegA4gSeqtsSdhVMjkAYZU15aFuRH7msPN3EuE8al)

[Пример готового дайджеста в Telehram](https://t.me/alexkrol/8510)

[Пример готового дайджеста в Youtube](http://youtube.com/post/UgkxFs7bfPTzCMBtYq_UT2ttLd6TVNRenVRL?si=olNJLuQs_ZVqlarq)

Автоматизированный пайплайн для создания авторских новостных дайджестов на русском языке. Собирает статьи с Perplexity AI, генерирует ироничные комментарии через Claude API и публикует в Facebook, Telegram, YouTube.

## Архитектура

```
iPhone (iOS Shortcut)        Chrome Extension
      │                            │
  POST /api/articles         POST /api/articles/batch
  { url }                    { items: [{url, title, content}] }
      │                            │
      └──────── API Server ────────┘
                    │
              SQLite (накопление)
                    │
              Queue Manager (каждые 60 сек)
                    │
              13+ статей? → Claude API
                    │
              Phase A: prompt.md → комментарий к каждой статье
              Phase B: assembly_prompt.md → сборка дайджеста
                    │
              Push-уведомление (Ntfy)
                    │
              Автопубликация (Facebook Page, Telegram, YouTube)
```

## Быстрый старт (локально)

```bash
cd news-digest-pipeline
cp .env.example .env
# Вставить ANTHROPIC_API_KEY в .env
npm install
npm start
```

Сервер запустится на `http://localhost:3000`.

### Проверка

```bash
# Health check
curl http://localhost:3000/health

# Добавить статью по URL
curl -X POST http://localhost:3000/api/articles \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://perplexity.ai/page/some-article"}'

# Пакетная загрузка (формат Chrome Extension)
curl -X POST http://localhost:3000/api/articles/batch \
  -H 'Content-Type: application/json' \
  -d '{"items": [{"url": "...", "title": "...", "content": "..."}]}'

# Ручная генерация дайджеста
curl -X POST http://localhost:3000/api/digests/generate

# Посмотреть дайджесты
curl http://localhost:3000/api/digests
```

## Production

Сервис задеплоен на VPS: **https://news.questtales.com**

### Деплой

Push в `main` → GitHub Actions автоматически деплоит на VPS через Docker.

```bash
git push origin main
# GitHub Actions: SSH → git pull → docker compose build → docker compose up -d
```

### Мониторинг

Скрипт `scripts/monitor.sh` проверяет каждые 5 минут:
- Контейнер запущен
- `/health` отвечает
- Диск и память < 90%
- Алерты через Ntfy

## Структура проекта

```
.
├── extension/                    # Chrome-расширение (сбор статей с Perplexity)
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   └── icon*.png
├── prompt.md                     # Промпт: комментарий к статье (ироничный тон)
├── prompt_deep.md                # Промпт: глубокая аналитика (философский тон)
├── assembly_prompt.md            # Промпт: сборка дайджеста
├── config.md                     # Настройки (хэштег, курс, граница)
│
├── news-digest-pipeline/         # Backend (Node.js + Express)
│   ├── src/
│   │   ├── index.js              # Entry point
│   │   ├── config.js             # Загрузка .env + промптов
│   │   ├── db/
│   │   │   ├── schema.sql        # SQLite схема
│   │   │   └── index.js          # CRUD операции
│   │   ├── routes/
│   │   │   ├── articles.js       # POST/GET/DELETE /api/articles
│   │   │   ├── digests.js        # POST/GET /api/digests
│   │   │   └── health.js         # GET /health
│   │   └── services/
│   │       ├── article-fetcher.js    # Парсинг URL → контент
│   │       ├── digest-generator.js   # 2-фазная генерация через Claude API
│   │       ├── queue-manager.js      # Автотриггер при 13+ статьях
│   │       ├── notifier.js           # Push через Ntfy.sh
│   │       └── publishers/
│   │           ├── facebook.js       # Facebook Page Graph API
│   │           ├── telegram.js       # Telegram Bot API
│   │           ├── youtube.js        # YouTube Community (placeholder)
│   │           └── index.js          # Оркестратор публикации
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── scripts/
│   │   └── monitor.sh            # Мониторинг VPS
│   ├── docs/
│   │   └── vps-setup.md          # Документация по серверу
│   ├── .env.example
│   └── package.json
│
└── .github/workflows/
    └── deploy.yml                # CI/CD: auto-deploy на VPS
```

## API

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/health` | Статус сервера |
| POST | `/api/articles` | Добавить статью по URL |
| POST | `/api/articles/batch` | Пакетная загрузка |
| GET | `/api/articles` | Список статей |
| GET | `/api/articles/stats` | Статистика |
| DELETE | `/api/articles/:id` | Удалить статью |
| POST | `/api/digests/generate` | Ручная генерация |
| GET | `/api/digests` | Список дайджестов |
| GET | `/api/digests/:id` | Дайджест с контентом |
| POST | `/api/digests/:id/publish` | Опубликовать |

## Chrome Extension

Расширение из папки `extension/` собирает статьи с Perplexity AI.

**Установка:**
1. `chrome://extensions/` → Режим разработчика
2. «Загрузить распакованное расширение» → выбрать папку `extension/`

**Использование:**
1. Открыть статьи на Perplexity в отдельных вкладках (10-15 штук)
2. Нажать иконку расширения → «Собрать новости»
3. Скачается JSON-файл, который можно загрузить через `/api/articles/batch`

## Настройка промптов

Промпты определяют тон и формат дайджеста. Хотите другую подачу — меняйте файлы:

- `prompt.md` — стиль комментариев (ироничный, скептический)
- `prompt_deep.md` — глубокая аналитика (философский, холодный)
- `assembly_prompt.md` — правила сборки дайджеста
- `config.md` — хэштег, курс, граница, хэштеги

## Переменные окружения

См. `news-digest-pipeline/.env.example` для полного списка. Ключевые:

| Переменная | Описание |
|-----------|----------|
| `ANTHROPIC_API_KEY` | Ключ Claude API |
| `CLAUDE_MODEL` | Модель (по умолчанию claude-opus-4-6) |
| `ARTICLE_THRESHOLD` | Порог автогенерации (по умолчанию 13) |
| `NTFY_TOPIC` | Топик для push-уведомлений |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Токен Facebook Page |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram бота |

## Технологии

- **Backend:** Node.js 20, Express
- **Database:** SQLite (better-sqlite3)
- **AI:** Claude API (Anthropic SDK)
- **Deploy:** Docker, GitHub Actions
- **Notifications:** Ntfy.sh
- **VPS:** Ubuntu 24.04, nginx, Let's Encrypt
