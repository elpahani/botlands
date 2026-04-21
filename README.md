# 🏗️ Botlands — Document Workspace & MCP Server

**Общее пространство для людей и AI-агентов.** Храни документы, генерируй контент, обрабатывай файлы — всё через веб-интерфейс или MCP API.

## Что это

Botlands — это документ-менеджер с MCP-интерфейсом, который позволяет AI-агентам (OpenClaw, Cursor, Windsurf, Claude и др.) работать с файлами наравне с человеком. Загружай, редактируй, конвертируй — агент делает то же самое через MCP.

## Архитектура

```
┌─────────────────────────────────────────────┐
│                  Frontend                    │
│          React + Vite + TailwindCSS          │
│              http://localhost:5173           │
└──────────────┬──────────────────────────────┘
               │ REST API + WebSocket
┌──────────────▼──────────────────────────────┐
│                  Backend                     │
│         Node.js + Express + Socket.IO       │
│              http://localhost:3001           │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │ REST API │  │ WebSocket│  │ MCP Server│ │
│  │  /api/*  │  │  Socket.IO│  │  /mcp/sse │ │
│  └──────────┘  └──────────┘  └───────────┘ │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │          Plugin System               │   │
│  │  • PDF Converter (Puppeteer)         │   │
│  │  • DOCX Editor (docxtemplater)       │   │
│  └──────────────────────────────────────┘   │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│              ./data/                         │
│         Файловое хранилище                   │
│    metadata.json + /files/                   │
└─────────────────────────────────────────────┘
```

## MCP Tools — 16 инструментов

Агенты получают полный контроль над рабочим пространством:

### Workspace
| Tool | Описание |
|------|----------|
| `get_workspace_state` | Дерево папок, документов, задач |
| `get_recent_actions` | Лог последних действий |

### Folders
| Tool | Описание |
|------|----------|
| `create_folder` | Создать папку |
| `rename_folder` | Переименовать |
| `move_folder` | Переместить |
| `delete_folder` | Удалить |

### Documents
| Tool | Описание |
|------|----------|
| `create_document` | Создать документ |
| `update_document` | Обновить содержимое |
| `rename_document` | Переименовать |
| `move_document` | Переместить |
| `delete_document` | Удалить |
| `read_document` | Прочитать содержимое |
| `get_folder_files` | Список файлов в папке |

### Tasks (Timeland)
| Tool | Описание |
|------|----------|
| `create_task` | Создать задачу |
| `update_task` | Обновить статус |
| `delete_task` | Удалить задачу |

## Структура проекта

```
botlands/
├── docker-compose.yml       # Backend + Frontend
├── .env                     # Дефолтные настройки
├── .gitignore
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── server.ts            # Express + MCP + Socket.IO
│       ├── pdf.ts               # Puppeteer PDF генерация
│       ├── logger.ts            # Логирование действий
│       ├── models/types.ts      # TypeScript типы
│       ├── routes/api.routes.ts # REST API
│       ├── services/
│       │   ├── mcp.service.ts   # MCP server (16 tools)
│       │   ├── storage.service.ts # Файловое хранилище
│       │   └── websocket.service.ts # Real-time обновления
│       └── plugins/
│           ├── plugin.interface.ts  # Интерфейс плагинов
│           ├── index.ts             # Plugin Manager
│           ├── pdf.plugin.ts        # HTML → PDF
│           └── doc-editor.plugin.ts # DOCX шаблоны
└── frontend/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── App.tsx              # Главное приложение
        ├── api.ts               # API клиент
        ├── hooks/               # React хуки
        └── components/
            ├── layout/Sidebar.tsx
            ├── preview/DocumentViewerModal.tsx
            ├── timeland/TimelandTab.tsx
            └── tools/            # Панели инструментов
```

## Быстрый старт

### Docker (рекомендуется)

```bash
# Клонируем
git clone https://github.com/elpahani/botlands.git
cd botlands

# Настраиваем
cp .env.example .env   # или правим .env

# Запускаем
docker compose up -d --build
```

Открываем:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api
- **MCP SSE:** http://localhost:3001/mcp/sse

### Вручную

```bash
# Backend
cd backend && npm install && npm run build && npm start

# Frontend (отдельный терминал)
cd frontend && npm install && npm run dev
```

## Подключение MCP

### OpenClaw / Cursor / Windsurf

```json
{
  "mcpServers": {
    "botlands": {
      "type": "sse",
      "url": "http://localhost:3001/mcp/sse"
    }
  }
}
```

### Claude Desktop

```json
{
  "mcpServers": {
    "botlands": {
      "url": "http://localhost:3001/mcp/sse",
      "transport": "sse"
    }
  }
}
```

## Структура данных

Данные хранятся в `./data/`:

```
data/
├── metadata.json       # Все метаданные (папки, документы, задачи, ревизии)
└── files/              # Физические файлы документов
    ├── abc123.pdf
    ├── def456.html
    └── ...
```

- **Inbox (Buffer)** — входящие документы, папка по умолчанию
- **Storage** — архив, постоянное хранилище
- **Ревизии** — каждая правка документа создаёт новую версию
- **PDF флаг** — ревизия помечается как PDF при конвертации

## Плагины

Плагины расширяют функциональность Botlands:

### PDF Converter
- HTML → PDF через Puppeteer (headless Chrome)
- Поддержка кириллицы
- Автоматическая конвертация при создании HTML документов

### DOCX Editor
- Заполнение шаблонов `.docx` с тегами `{Имя}`, `{Дата}`, и т.д.
- Извлечение текста из DOCX через mammoth
- Генерация документов на основе шаблонов

### Создание плагина

```typescript
import { BotlandsPlugin } from './plugin.interface';

export class MyPlugin implements BotlandsPlugin {
  name = 'my-plugin';
  
  async initialize(context: PluginContext): Promise<void> {
    // Регистрируем инструменты, маршруты, и т.д.
  }
}
```

## Переменные окружения

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `WORKSPACE_PATH` | `./data` | Путь к рабочему пространству |
| `OLLAMA_HOST` | `http://ollama:11434` | Ollama API (для AI-плагинов) |
| `DATA_DIR` | `/app/data` | Внутренний путь в контейнере |
| `NODE_ENV` | `production` | Режим работы |

## Оркестратор

Botlands входит в **Claw Orchestrator** — общую систему сервисов:

```
claw-orchestrator/
├── docker-compose.yml          # include всех сервисов
├── .env                        # Приватные ключи (НЕ коммитить)
├── .workspace/                 # Общее рабочее пространство
├── inference-server/           # Ollama (LLM инференс)
│   └── docker-compose.yml
└── botlands/                   # ← Этот проект
    └── docker-compose.yml
```

Сети Docker изолированы:
- **inference** — Ollama и сервисы которым нужен LLM
- **botlands** — Backend ↔ Frontend

## Tech Stack

- **Backend:** Node.js, Express 5, Socket.IO, MCP SDK, Puppeteer, mammoth, docxtemplater
- **Frontend:** React, Vite, TailwindCSS, Socket.IO Client
- **Storage:** File-based (metadata.json + files/)
- **Transport:** REST API + WebSocket + MCP over SSE

## License

MIT