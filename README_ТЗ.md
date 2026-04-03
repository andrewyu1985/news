# Техническое задание: News Digest Pipeline v1.0

## Обзор

Создано полное техническое задание для автоматизации News Digest Pipeline — системы сбора, обработки и распространения новостных дайджестов на русском языке.

## Документ

- **Файл**: `ТЗ_News_Digest_Pipeline_v1.docx`
- **Объём**: ~20 страниц (285 параграфов)
- **Язык**: 100% русский
- **Формат**: MS Word 2007+ (.docx)
- **Статус валидации**: PASSED

## Структура документа

### 1. Введение и обзор проекта
- Цель проекта: автоматизация конвейера от сбора статей до публикации
- Заинтересованные стороны
- Область действия (Фаза 1: standalone система)

### 2. Текущее состояние (AS-IS)
- Процесс: ручной сбор через Chrome Extension → загрузка JSON в Claude → генерация дайджеста
- Структура расширения (Manifest v3)
- Алгоритм: парсинг, фильтрация, дедупликация
- Проблемы: ручные действия на каждом этапе, невозможность масштабирования

### 3. Целевое состояние (TO-BE)
- Полная автоматизация: iOS Shortcut → API → накопление → автогенерация → уведомление → Facebook
- Поддержка мобильных устройств
- OS-уведомления при готовности дайджеста
- Интеграция с проектом Tracking

### 4. Архитектура системы
**Компоненты:**
- Input Methods (iOS Shortcut, Telegram Bot, Chrome Extension)
- API Gateway
- Article Accumulator (база данных)
- Queue Manager & Digest Generator
- Notification Service (APNs)
- Social Media Publisher (Facebook API)
- Logger & Analytics

**Технологический стек:**
- Node.js 18+ + Express.js
- SQLite (dev) / PostgreSQL (prod)
- Bull (Redis) для очереди задач
- Claude API для генерации
- Facebook Graph API для публикации
- Apple Push Notification Service (APNs)

### 5. Спецификация компонентов

#### Input Methods — Сравнение
| Метод | Платформа | Преимущества | Недостатки | Приоритет |
|-------|-----------|--------------|-----------|-----------|
| iOS Shortcut | iOS (iPhone/iPad) | Встроено в ОС, быстро, без инфры | Требует настройки пользователем | Высокий |
| Telegram Bot | Telegram (все платформы) | Универсально, простой API, cross-platform | Требует аккаунта Telegram | Средний |
| Desktop Extension | Chrome | Уже работает, отлично интегрирован | Только для десктопа | Готово |

#### Основные компоненты
- **API Gateway**: POST /api/articles (добавить статью), GET /api/articles (список)
- **Article Accumulator**: CRUD для статей, дедупликация по URL, управление статусом
- **Digest Generator**: обработка через Claude API с соблюдением prompt.md и assembly_prompt.md
- **Queue Manager**: проверка порога (13+ статей) каждую минуту, триггер генерации
- **Notification Service**: push на iPhone через APNs
- **Social Media Publisher**: публикация на Facebook через Graph API

### 6. Форматы данных

**Входной JSON** (от расширения):
```json
{
  "timestamp": "2026-04-02T14:30:00Z",
  "count": 12,
  "items": [
    { "url": "...", "title": "...", "content": "..." }
  ],
  "skipped": [],
  "duplicates": []
}
```

**Запись в БД**:
```json
{
  "id": "uuid",
  "url": "string",
  "title": "string",
  "content": "string (nullable)",
  "source": "perplexity | telegram | shortcut",
  "status": "new | pending | published | archived",
  "created_at": "timestamp",
  "digest_id": "uuid | null"
}
```

**Дайджест**:
```json
{
  "id": "uuid",
  "date": "2026-04-02",
  "part": 1,
  "articles_count": 15,
  "content": "#новости\n1. [комментарий]\n[url]\n...",
  "status": "draft | published",
  "facebook_post_id": "string | null"
}
```

### 7. API спецификация

**Основные endpoints:**
- `POST /api/articles` — добавить статью
- `GET /api/articles` — список статей (с фильтрацией)
- `DELETE /api/articles/:id` — удалить статью
- `POST /api/digests` — создать дайджест вручную
- `GET /api/digests` — список дайджестов
- `GET /api/digests/:id` — получить дайджест
- `POST /api/digests/:id/publish` — опубликовать на Facebook
- `GET /api/config` — текущие настройки

### 8. Интеграция с проектом Tracking (Фаза 2)
- News Digest Pipeline остаётся независимым микросервисом
- Tracking обращается через HTTP API
- UI панель в Tracking для управления дайджестом
- WebSocket для real-time обновлений

### 9. Фазы реализации
1. **Фаза 1 (Неделя 1–2)**: Ядро системы
   - Node.js проект, Express.js, SQLite
   - Article Accumulator (CRUD)
   - API Gateway
   - Queue Manager
   - Digest Generator с Claude API

2. **Фаза 2 (Неделя 3–4)**: Input методы
   - iOS Shortcut для отправки статей
   - Telegram Bot
   - Обновление Chrome Extension

3. **Фаза 3 (Неделя 5–6)**: Notifications & Publishing
   - APNs для push-уведомлений
   - Facebook Graph API интеграция
   - Логирование и аналитика

4. **Фаза 4 (Неделя 7–8)**: Интеграция с Tracking
   - UI панель
   - WebSocket
   - Тестирование и оптимизация

**Общий срок: ~8 недель (2 месяца)**

### 10. Открытые вопросы

1. Как передать URL с iPhone на Perplexity (iOS Shortcut может не поддерживать глубокие ссылки)?
2. Загружать ли контент статьи на момент отправки или только URL (требует парсинга)?
3. Как реализовать push-уведомления без native iOS приложения (требует Apple Developer Account)?
4. Как управлять access token Facebook (истекает через ~60 дней)?
5. Начать с SQLite или PostgreSQL?

### 11. Риски

- **API Rate Limiting**: Claude API имеет лимиты на количество запросов
- **Facebook API Breaking Changes**: регулярные обновления могут требовать адаптации
- **Parsing Perplexity**: структура HTML может измениться
- **Отсутствие мобильного приложения**: затруднит отправку статей с iPhone
- **Инфраструктура**: требуется надёжный хостинг с поддержкой Node.js и Redis

## Приложения

Документ содержит полные примеры:
- Правила генерации комментариев (из prompt.md)
- Правила сборки дайджеста (из assembly_prompt.md)
- Пример входного JSON (Chrome Extension)
- Пример выходного дайджеста
- Переменные окружения для deployment

## Как использовать этот документ

1. **Для разработчиков**: используйте как техническое руководство реализации
2. **Для управления проектом**: определяет фазы, сроки и ресурсы
3. **Для стейкхолдеров**: описывает текущее состояние и целевую архитектуру
4. **Для тестирования**: содержит API спецификацию и форматы данных

## Дополнительные файлы

В проекте также присутствуют конфигурационные файлы:
- `prompt.md` — правила генерации авторских комментариев
- `assembly_prompt.md` — правила сборки дайджеста
- `config.md` — настройки (хэштеги, курс, граница)
- `CLAUDE.md` — инструкции для Claude

## История версий

- **v1.0** (2 апреля 2026) — Первая версия ТЗ, описывает Фазу 1 (standalone система)

---

**Статус**: Готово к использованию
**Валидация**: Пройдена (MS Word 2007+ совместимость подтверждена)
