import type { DocLandPlugin } from './plugin.interface.js';
import { pdfConverterPlugin } from './pdf.plugin.js';
import { DocEditorPlugin } from './doc-editor.plugin.js';
import { OCRPlugin } from './ocr.plugin.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export class PluginManager {
    private plugins: DocLandPlugin[] = [];

    constructor() {
        // Загружаем базовые плагины
        this.register(pdfConverterPlugin);
        this.register(new DocEditorPlugin());
        this.register(new OCRPlugin());
    }

    public register(plugin: DocLandPlugin) {
        this.plugins.push(plugin);
        console.log(`[PluginManager] Зарегистрирован плагин: ${plugin.name} (${plugin.id})`);
    }

    public getPlugins(): DocLandPlugin[] {
        return this.plugins;
    }

    public getPlugin(id: string): DocLandPlugin | undefined {
        return this.plugins.find(p => p.id === id);
    }

    /**
     * Инициализирует все инструменты от всех плагинов внутри MCP-сервера AI-агента
     */
    public initializeMcpTools(mcpServer: McpServer, onActionCallback: () => void) {
        this.plugins.forEach(plugin => {
            // Перехватываем регистрацию, чтобы дать плагину знать о WebSocket обновлениях
            plugin.registerMcpTools(mcpServer);
        });
    }
}

// Экспортируем синглтон для всего приложения
export const pluginManager = new PluginManager();
