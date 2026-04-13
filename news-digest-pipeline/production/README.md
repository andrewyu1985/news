# Media Production Pipeline

**Вход:** текст дайджеста  
**Выход:** готовые медиа-ассеты (изображение, видео, аудио)

## Архитектура

```mermaid
flowchart TD
    A[📰 Текст дайджеста] --> B[🤖 Claude API]
    
    B --> C1[📝 Кликбейтный заголовок<br/>+ промпт для изображения]
    B --> C2[📋 Сценарий видео<br/>JSON: шоты × 5-15 сек]
    B --> C3[📝 Адаптированный текст<br/>для озвучки]
    
    subgraph Image["🖼 Image Production"]
        C1 --> I1[🎨 Шаблон-референс]
        I1 --> I2[Recraft V3 / fal.ai<br/>img2img → фон]
        I2 --> I3[Sharp / Canvas<br/>наложение текста]
        I3 --> I4[📸 image.png<br/>1080×1350]
    end
    
    subgraph Video["🎬 Video Production"]
        C2 --> V1[🎨 Style Element]
        V1 --> V2[Kling 3.0 / Veo 3.1<br/>параллельная генерация]
        V2 --> V3[FFmpeg concat<br/>+ resize 1080×1920]
        V3 --> V4[📱 reel.mp4]
    end
    
    subgraph Audio["🎙 Audio Production"]
        C3 --> A1[🎙 Voice Clone ID]
        A1 --> A2[ElevenLabs / Fish Audio<br/>TTS генерация]
        A2 --> A3[🔊 voiceover.mp3]
    end
    
    A3 --> V3
    
    I4 --> OUT[📦 Готовые ассеты]
    V4 --> OUT
    A3 --> OUT

    style A fill:#e3f2fd
    style OUT fill:#c8e6c9
    style Image fill:#fff8e1,stroke:#ffc107
    style Video fill:#e8eaf6,stroke:#3f51b5
    style Audio fill:#fce4ec,stroke:#e91e63
```

## Компоненты

| Компонент | Сервис | Цена/ед | Статус |
|-----------|--------|---------|--------|
| **Image** | Recraft V3 (fal.ai) | $0.04/img | 📋 Исследование |
| **Video** | Kling 3.0 (EvoLink) | $0.075/сек | 📋 Исследование |
| **Audio** | ElevenLabs Flash v2.5 | $22/мес план | 📋 Исследование |

## Структура

```
production/
├── README.md           # Этот файл
├── image/
│   ├── README.md       # Архитектура Image pipeline
│   ├── research-image-apis.md
│   ├── templates/      # Шаблоны-референсы
│   ├── fonts/          # Шрифты для текста
│   ├── output/         # Готовые изображения
│   └── src/            # Скрипты генерации
├── video/
│   ├── README.md       # Архитектура Video pipeline
│   ├── research-video-apis.md
│   ├── templates/      # Style reference
│   ├── output/         # Готовые видео
│   └── src/            # Скрипты генерации
└── audio/
    ├── README.md       # Архитектура Audio pipeline
    ├── research-tts-apis.md
    ├── voice-samples/  # Образцы для клонирования
    └── src/            # Скрипты генерации
```
