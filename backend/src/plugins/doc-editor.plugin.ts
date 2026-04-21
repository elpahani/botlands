import type { DocLandPlugin } from './plugin.interface.js';
import { storageService } from '../services/storage.service.js';
import { logAction } from '../logger.js';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { wsService } from '../services/websocket.service.js';
import type { Document } from '../models/types.js';

const require = createRequire(import.meta.url);
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const InspectModule = require('docxtemplater/js/inspect-module.js');

export class DocEditorPlugin implements DocLandPlugin {
    id = 'doc-editor';
    name = 'Doc Editor';
    description = 'Парсит файл Word (.docx) на наличие {переменных} и позволяет заполнить их значениями, создавая готовый документ';
    supportedExtensions = ['.docx'];

    registerMcpTools(mcpServer: McpServer): void {
        mcpServer.tool('get_docx_tags',
            'Получить список всех переменных (тегов) {Имя} в документе .docx',
            { file_id: require('zod').z.string() },
            async ({ file_id }: { file_id: string }) => {
                try {
                    const doc = storageService.getDocument(file_id);
                    if (!doc) throw new Error('Document not found');
                    
                    const res = await this.execute(file_id, doc, 'BOT', { action: 'get_tags' });
                    
                    return {
                        content: [{ type: 'text', text: `Найденные переменные: ${JSON.stringify(res.tags)}` }]
                    };
                } catch (e: any) {
                    return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
                }
            }
        );

        mcpServer.tool('fill_docx_template',
            'Заполняет шаблон Word (.docx) переданными JSON данными',
            { 
                file_id: require('zod').z.string(), 
                data_json: require('zod').z.string().describe('JSON строка с ключами для замены (например: {"ClientName": "Иван"})')
            },
            async ({ file_id, data_json }: { file_id: string, data_json: string }) => {
                try {
                    const doc = storageService.getDocument(file_id);
                    if (!doc) throw new Error('Document not found');
                    
                    let data = {};
                    try {
                        data = JSON.parse(data_json);
                    } catch (e) {
                        throw new Error('Invalid JSON format in data_json');
                    }
                    
                    const newDoc = await this.execute(file_id, doc, 'BOT', { action: 'fill_template', tags: data });
                    
                    return {
                        content: [{ type: 'text', text: `Шаблон успешно заполнен. Новый документ: ${newDoc.id}` }]
                    };
                } catch (e: any) {
                    return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
                }
            }
        );
    }

    async execute(documentId: string, doc: Document, actor: 'USER' | 'BOT' = 'USER', data: any = {}): Promise<any> {
        const rev = doc.revisions.find(r => r.id === doc.currentRevisionId);
        const ext = rev?.extension || path.extname(doc.title).toLowerCase();
        
        if (ext !== '.docx') {
            throw new Error('Плагин поддерживает только формат .docx.');
        }

        const filePath = storageService.getFilePath(documentId, doc.currentRevisionId, 'original');
        
        // Load the docx file as a binary
        const content = fs.readFileSync(filePath, 'binary');
        
        // Initialize PizZip
        const zip = new PizZip(content);

        if (data.action === 'get_tags') {
            const iModule = new InspectModule();
            // Initialize with the inspect module to gather tags without rendering
            const docx = new Docxtemplater(zip, { modules: [iModule], paragraphLoop: true, linebreaks: true });
            
            // Render is required for inspect-module to populate getAllTags
            try {
                docx.render({});
            } catch (e) {
                // Render will likely throw errors because data is missing, but that's fine
                // because the inspect module will still have captured the tags.
            }
            
            const tags = iModule.getAllTags();
            return { tags: Object.keys(tags || {}) };
        }
        
        if (data.action === 'fill_template') {
            const docx = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });

            // Set the template variables
            docx.render(data.tags || {});

            // Get the zip document and generate it as a nodebuffer
            const buf = docx.getZip().generate({
                type: 'nodebuffer',
                compression: 'DEFLATE',
            });

            const newTitle = doc.title.replace(/\.docx$/i, ' (Заполненный).docx');
            
            // Create the filled new document
            const newDoc = storageService.createDocument(newTitle, buf, doc.folderId, '.docx');
            
            logAction(actor, 'PLUGIN:FILL_DOCX', { originalId: doc.id, newId: newDoc.id });
            wsService.broadcastUpdate();
            
            return newDoc;
        }

        throw new Error('Укажите корректное действие (action) для Doc Editor');
    }
}
