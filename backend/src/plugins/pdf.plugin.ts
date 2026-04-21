import { z } from 'zod';
import type { DocLandPlugin } from './plugin.interface.js';
import { storageService } from '../services/storage.service.js';
import { convertHtmlToPdf } from '../pdf.js';
import { logAction } from '../logger.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { wsService } from '../services/websocket.service.js';
import type { Document } from '../models/types.js';

export const pdfConverterPlugin: DocLandPlugin = {
    id: 'pdf-converter',
    name: 'PDF Конвертер',
    description: 'Идеально конвертирует HTML в многостраничный PDF-файл (формат A4).',
    supportedExtensions: ['.html', '.htm'],

    registerMcpTools(mcpServer: McpServer) {
        mcpServer.tool('convert_to_pdf',
            'Триггерит конвертацию сохраненного HTML в PDF с сохранением стилей TailwindCSS',
            { file_id: z.string() },
            async ({ file_id }) => {
                try {
                    const doc = storageService.getDocument(file_id);
                    if (!doc) throw new Error('Document not found');
                    
                    await this.execute!(file_id, doc, 'BOT');
                    
                    return {
                        content: [{ type: 'text', text: `Successfully converted to PDF. Revision: ${doc.currentRevisionId}. Tell the user the UI updated.` }]
                    };
                } catch (e: any) {
                    return { content: [{ type: 'text', text: `Plugin Error: ${e.message}` }], isError: true };
                }
            }
        );
    },

    async execute(fileId: string, doc: Document, actor: 'USER' | 'BOT' = 'USER') {
        const revId = doc.currentRevisionId;
        const rev = doc.revisions.find(r => r.id === revId);
        
        if (!rev || !this.supportedExtensions.includes(rev.extension || '.html')) {
            throw new Error(`PDF conversion not supported for this file type: ${rev?.extension}`);
        }

        const htmlPath = storageService.getFilePath(fileId, revId, 'original');
        const pdfPath = storageService.getFilePath(fileId, revId, 'pdf');
        
        await convertHtmlToPdf(htmlPath, pdfPath);
        storageService.markPdfGenerated(fileId, revId);
        
        logAction(actor, 'PLUGIN:CONVERT_TO_PDF', { id: fileId, revision: revId });
        wsService.broadcastUpdate();
        return { success: true, revision: revId };
    }
};
