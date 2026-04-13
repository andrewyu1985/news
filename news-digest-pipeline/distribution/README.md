# Distribution Pipeline — Мультиплатформенная дистрибуция

**Вход:** готовые медиа-ассеты (текст, изображение, видео, аудио)  
**Выход:** опубликовано на платформах

## Архитектура

```mermaid
flowchart TD
    A[📦 Готовые ассеты<br/>текст + изображение + видео + аудио] --> B{Дистрибуция}
    
    subgraph working["✅ Работает"]
        B --> T[📱 Telegram<br/>Bot API<br/>авто-разбивка >4096]
        B --> FP[📄 Facebook Page<br/>Graph API<br/>Page Access Token]
        B --> FA[👤 Facebook Profile<br/>Patchright<br/>отдельный Chromium]
    end
    
    subgraph testing["🧪 Тестируется"]
        B --> IG[📸 Instagram<br/>Graph API + картинка]
    end
    
    subgraph planned["📋 Планируется"]
        B --> YT[🎬 YouTube<br/>Shorts / Community]
        B --> TT[🎵 TikTok<br/>Video upload]
    end

    style A fill:#e3f2fd
    style working fill:#e8f5e9,stroke:#4caf50
    style testing fill:#fff8e1,stroke:#ffc107
    style planned fill:#f3e5f5,stroke:#9c27b0
```

## Каналы дистрибуции

| Канал | Метод | Тип контента | Статус |
|-------|-------|-------------|--------|
| **Telegram** (@alexkrol) | Bot API | Текст | ✅ Работает |
| **Facebook Page** (Alex Krol) | Graph API | Текст | ✅ Работает |
| **Facebook Profile** | Patchright | Текст | ✅ Тестируется |
| **Instagram** (@alexeykrol) | Graph API / Patchright | Картинка + текст | 📋 Планируется |
| **YouTube** | Patchright | Видео / Community | 📋 Планируется |
| **TikTok** | API / Patchright | Видео | 📋 Планируется |

## Последовательность публикации

```mermaid
sequenceDiagram
    participant U as 👤 Пользователь
    participant D as 📊 Dashboard
    participant S as 🖥️ VPS Server
    participant M as 💻 Mac (локально)
    
    U->>D: Нажимает "Опубликовать"
    D->>S: POST /api/digests/:id/publish
    
    par Мгновенно (API)
        S->>S: Telegram → канал @alexkrol
        S->>S: Facebook → Page Alex Krol
    end
    
    S-->>D: {telegram: ✅, facebook: ✅}
    
    Note over M: Через 2-5 мин (watcher)
    M->>M: Patchright → Facebook Profile
    M-->>U: 🔔 Опубликовано в FB Profile
    
    Note over M: Следом
    M->>M: Instagram → картинка + caption
    M-->>U: 🔔 Опубликовано в Instagram
```

## Структура

```
distribution/
├── README.md               # Этот файл
├── telegram/
│   ├── telegram.js          # Publisher: Bot API + message splitting
│   └── telegram-setup.md    # Документация настройки
├── facebook-page/
│   ├── facebook.js          # Publisher: Graph API
│   └── facebook-page-setup.md
├── facebook-profile/
│   ├── fb-publish.js        # Patchright automation
│   ├── fb-profile-watcher.js # Автоматический watcher (launchd)
│   └── facebook-setup.md    # Документация (наши мытарства)
├── instagram/               # TODO
│   └── README.md
├── youtube/                 # TODO
│   └── README.md
└── tiktok/                  # TODO
    └── README.md
```

## Env переменные

```env
# Telegram
TELEGRAM_BOT_TOKEN=...
TELEGRAM_PUBLISH_CHAT_ID=-100...  # Канал (с -100 префиксом)

# Facebook Page
FACEBOOK_PAGE_ID=YOUR_FACEBOOK_PAGE_ID
FACEBOOK_PAGE_ACCESS_TOKEN=...    # Page token (не User token!)

# Facebook Profile
# Сессия хранится в .fb-profile/ (Patchright persistent context)

# Instagram (TODO)
INSTAGRAM_BUSINESS_ACCOUNT_ID=...
```
