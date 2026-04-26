# Botlands 🤖 — AI Document Workspace

## Описание

**Botlands** — это документ-ориентированное рабочее пространство для AI-агентов и людей. Оно позволяет создавать, редактировать и управлять документами через **MCP (Model Context Protocol)**, а также запускать программы через **Compland** (Compute Land).

## Архитектура

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Nginx        │────▶│    Backend      │
│   (React)       │     │   (Reverse      │     │   (Node.js)     │
│   Port: 5173    │     │    Proxy)       │     │   Port: 3001    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                              ┌─────────────────┐       │
                              │   ComfyUI       │◀────┘
                              │   (Windows)     │    (MCP + AI)
                              │   Port: 8188    │
                              └─────────────────┘
```

## Основные Компоненты

| Компонент | Описание |
|-----------|----------|
| **Storage** | Файловая система документов и папок |
| **MCP** | Model Context Protocol для AI интеграции |
| **Compland** | Выполнение Python/Node/Rust программ |
| **OCR** | Распознавание текста |
| **Vision** | Анализ изображений через Florence2 |
| **Timeland** | Календарь задач с WebSocket |
| **Workland** | Kanban доска задач |
| **Docland** | Обозреватель документов |

## Технологии

### Frontend
- React 19 + TypeScript
- TailwindCSS 4.x
- Socket.io (real-time)
- ReactMarkdown (Markdown просмотр)
- XLSX/PapaParse (таблицы)

### Backend
- Node.js + Express
- TypeScript
- Socket.io
- File-based storage

### AI/ML
- ComfyUI (Flux 2 Klein)
- Florence2 (vision)
- PaddleOCR (OCR)

## MCP Инструменты

| Инструмент | Описание |
|------------|----------|
| `create_document` | Создать документ |
| `update_document` | Обновить документ |
| `delete_document` | Удалить документ |
| `list_folders` | Список папок |
| `create_folder` | Создать папку |
| `list_documents` | Список документов |
| `move_document` | Переместить документ |
| `upload_file` | Загрузить файл |
| `fill_docx_template` | Заполнить шаблон Word |
| `convert_to_pdf` | Конвертировать в PDF |
| `list_tasks` | Список задач |
| `create_task` | Создать задачу |
| `run_script` | Запустить скрипт |

## Запуск

```bash
# 1. Клонировать
git clone github.com:elpahani/botlands.git

# 2. Настроить окружение
# Скопировать .env.example → .env и заполнить

# 3. Запустить
cd botlands
docker compose up --build -d

# 4. Открыть
http://localhost:5173
```

## Переменные Окружения

```
# Корневой .env (claw-orchestrator/)
BOT_TOKEN=...
CHANNEL_ID=...

# Botlands .env (botlands/)
COMPLAND_BASE_PATH=/app/compland
COMPLAND_MAX_PARALLEL=4
COMPLAND_TIMEOUT_MS=300000
```

## Лицензия

MIT
