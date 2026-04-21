import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Document } from '../models/types.js';

/**
 * Базовый интерфейс для всех плагинов DocLand
 */
export interface DocLandPlugin {
    /**
     * Уникальный идентификатор плагина (например, 'pdf-converter')
     */
    id: string;
    
    /**
     * Название для отображения в UI
     */
    name: string;
    
    /**
     * Описание того, что делает плагин (для бота и UI)
     */
    description: string;
    
    /**
     * Массив поддерживаемых расширений файлов, к которым применим этот плагин (например, ['.html'])
     */
    supportedExtensions: string[];

    /**
     * Регистрирует инструменты этого плагина в MCP сервере бота
     */
    registerMcpTools(mcpServer: McpServer): void;

    /**
     * Выполнение основного действия плагина из UI (если применимо)
     */
    execute?(fileId: string, doc: Document, actor?: 'USER' | 'BOT', data?: any): Promise<any>;
}
