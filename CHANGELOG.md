# Changelog

Все значимые изменения в проекте документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/).

---

## [2.0.4] — 2026-04-13

### Security hardening + публичный релиз

#### Добавлено

- Раздельные ключи для API и Dashboard
- 256-bit рандомные ключи (crypto.randomBytes)
- Rate limit на dashboard (10 attempts / 15 min)
- Timing-safe сравнение (crypto.timingSafeEqual)
- Домен заменён на плейсхолдеры для публичного репозитория
- Версия в README и Dashboard

---

## [2.0.3] — 2026-04-13

### Per-platform publishing + digest fixes

#### Добавлено

- Кнопки публикации по платформам (📨 TG / 📘 FB отдельно)
- Уникальный seq_number для каждого дайджеста
- Кнопка удаления дайджеста
- Автоудаление преамбулы перед #новости
- Защита от дубликатов статей между дайджестами

---

## [2.0.2] — 2026-04-13

### Security audit + authentication

#### Добавлено

- API аутентификация (Bearer token)
- Dashboard аутентификация (HTTP Basic Auth)
- Rate limiting (30/5/3 req/min)
- SSRF-защита (whitelist perplexity.ai)
- Удаление body logging в production
- Полный аудит безопасности (SECURITY_AUDIT_2026-04-13.md)

---

## [2.0.1] — 2026-04-12

### Facebook Profile automation

#### Добавлено

- Публикация в личный Facebook Profile через Patchright (stealth Playwright)
- Отдельный Chromium с persistent session (не мешает основному Chrome)
- Удаление link preview сниппетов перед публикацией
- macOS алерт перед публикацией
- fb-profile-watcher.js (launchd cron, каждые 5 мин)

---

## [2.0.0] — 2026-04-11

### Auto-publishing + Dashboard

#### Добавлено

- **Сбор новостей**: Telegram-бот принимает URL от пользователя, Chrome Extension для пакетной загрузки
- **Генерация дайджестов**: 2-фазная генерация через Claude API (Opus 4) — комментарии + сборка
- **Dashboard**: веб-интерфейс для управления дайджестами (просмотр, копирование, публикация, удаление)
- **Публикация в Telegram**: Bot API, автоматическая разбивка на части по 4096 символов
- **Публикация в Facebook Page**: Graph API v19.0, Page Access Token
- **Публикация в Facebook Profile**: browser automation через Patchright (stealth Playwright fork)
- **Обогащение контента**: local-fetcher.js — извлечение контента через Chrome + AppleScript (обход Cloudflare)
- **Queue Manager**: автоматическая генерация при 13+ статьях
- **Push-уведомления**: Ntfy.sh
- **Docker**: Dockerfile + docker-compose.yml с Traefik reverse proxy
- **iOS Shortcut**: отправка URL через Share Sheet

#### Безопасность

- API аутентификация (Bearer token)
- Dashboard аутентификация (HTTP Basic Auth, отдельный пароль)
- Rate limiting: 30 req/min (API), 5/min (publish), 3/min (generate), 10 attempts/15min (dashboard)
- SSRF-защита: whitelist только perplexity.ai
- Timing-safe сравнение ключей (crypto.timingSafeEqual)
- Полный аудит безопасности (SECURITY_AUDIT_2026-04-13.md)

#### Медиа-пайплайны (в разработке)

- **Instagram**: генерация заголовков (5-step method, Opus 4), наложение текста на шаблоны (Sharp)
- **Video**: исследование завершено (Kling 3.0, Veo 3.1, Seedance 2.0)
- **Audio**: placeholder

#### Документация

- Настройка Telegram (бот + канал)
- Настройка Facebook Page (Graph API, получение токена)
- Настройка Facebook Profile (Patchright, обход bot detection)
- Настройка VPS (Docker, Traefik, мониторинг)
- iOS Shortcut
- Mermaid-диаграммы архитектуры в README

---

## [0.1.0] — 2026-04-03

### Прототип

#### Добавлено

- Базовая структура проекта
- SQLite схема (articles + digests)
- Express API skeleton
- Chrome Extension для сбора статей с Perplexity
- Промпты: prompt.md, assembly_prompt.md, config.md
