import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { z } from 'zod';
import { vmMcpTools } from '../compland/mcp-tools.js';
import { storageService, INBOX_FOLDER_ID, STORAGE_FOLDER_ID } from './storage.service.js';
import { logAction, getRecentLogs } from '../logger.js';
import { wsService } from './websocket.service.js';
import { pluginManager } from '../plugins/index.js';
import type { Request, Response } from 'express';

// Store all active transports by sessionId so POST requests can find them
const activeTransports = new Map<string, SSEServerTransport>();

export class MCPService {
    private workspaceCache: { hash: string; data: string } | null = null;

    private computeWorkspaceHash(): string {
        const folders = storageService.listFolders();
        const documents = storageService.listDocuments();
        const tasks = storageService.listTasks();
        return JSON.stringify({ folders: folders.length, documents: documents.length, tasks: tasks.length });
    }

    private buildWorkspaceTree(maxDepth?: number): string {
        const folders = storageService.listFolders();
        const documents = storageService.listDocuments();
        const tasks = storageService.listTasks();

        let output = "=== Текущее состояние рабочего пространства ===\n";

        const renderTree = (parentId: string | null, depth: number) => {
            if (maxDepth !== undefined && depth > maxDepth) return;

            const indent = "  ".repeat(depth);

            // Render subfolders
            const subFolders = folders.filter(f => f.parentId === parentId);
            for (const folder of subFolders) {
                output += `${indent}📁 ${folder.name} (ID: ${folder.id})\n`;
                renderTree(folder.id, depth + 1);
            }

            // Render documents
            const docs = documents.filter(d => d.folderId === parentId);
            for (const doc of docs) {
                const ext = doc.revisions.find(r => r.id === doc.currentRevisionId)?.extension || '.html';
                const hasPdf = doc.revisions.some(r => r.hasPdf);
                output += `${indent}📄 ${doc.title} [ext: ${ext}, revs: ${doc.revisions.length}${hasPdf ? ', has_pdf' : ''}] (ID: ${doc.id})\n`;
            }
        };

        output += "\n📂 STORAGE (Корневая папка хранилища) (ID: storage)\n";
        renderTree(STORAGE_FOLDER_ID, 1);
        renderTree(null, 1);

        output += "\n📥 INBOX (Входящие файлы) (ID: inbox)\n";
        renderTree(INBOX_FOLDER_ID, 1);

        output += "\n📅 TASKS (Задачи календаря Timeland)\n";
        if (tasks.length === 0) {
            output += "  (Нет задач)\n";
        } else {
            for (const task of tasks) {
                output += `  ✅ [${task.date} ${task.time}] ${task.title} (Status: ${task.status}, ID: ${task.id})\n`;
            }
        }

        return output;
    }

    private registerTools(mcpServer: McpServer) {
        mcpServer.tool('get_workspace_state',
            'Возвращает компактное текстовое дерево всех папок и файлов. Опционально можно ограничить глубину дерева параметром max_depth.',
            { max_depth: z.number().optional() },
            async ({ max_depth }) => {
                logAction('BOT', 'GET_WORKSPACE_STATE', { max_depth });

                const currentHash = this.computeWorkspaceHash();
                const cacheKey = `${currentHash}-${max_depth || 'full'}`;

                if (this.workspaceCache && this.workspaceCache.hash === cacheKey) {
                    return { content: [{ type: 'text', text: this.workspaceCache.data }] };
                }

                const data = this.buildWorkspaceTree(max_depth);
                this.workspaceCache = { hash: cacheKey, data };
                return { content: [{ type: 'text', text: data }] };
            }
        );

        mcpServer.tool('get_recent_actions',
            'Возвращает логи последних действий (до 50 строк).',
            { lines: z.number().optional() },
            async ({ lines }) => {
                logAction('BOT', 'GET_RECENT_ACTIONS', {});
                return { content: [{ type: 'text', text: getRecentLogs(lines || 50) }] };
            }
        );

        mcpServer.tool('create_folder',
            'Создает новую папку',
            { name: z.string(), parent_id: z.string().optional() },
            async ({ name, parent_id }) => {
                try {
                    const folder = storageService.createFolder(name, parent_id || null);
                    logAction('BOT', 'CREATE_FOLDER', { id: folder.id, name });
                    wsService.broadcastUpdate();
                    return { content: [{ type: 'text', text: `Folder created. ID: ${folder.id}` }] };
                } catch (e: any) { return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true }; }
            }
        );

        mcpServer.tool('rename_folder',
            'Переименовывает папку',
            { folder_id: z.string(), new_name: z.string() },
            async ({ folder_id, new_name }) => {
                try {
                    const folder = storageService.renameFolder(folder_id, new_name);
                    logAction('BOT', 'RENAME_FOLDER', { id: folder.id, new_name });
                    wsService.broadcastUpdate();
                    return { content: [{ type: 'text', text: `Folder renamed.` }] };
                } catch (e: any) { return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true }; }
            }
        );

        mcpServer.tool('move_folder',
            'Перемещает папку',
            { folder_id: z.string(), dest_folder_id: z.string() },
            async ({ folder_id, dest_folder_id }) => {
                try {
                    const folder = storageService.moveFolder(folder_id, dest_folder_id);
                    logAction('BOT', 'MOVE_FOLDER', { id: folder.id, dest_folder_id });
                    wsService.broadcastUpdate();
                    return { content: [{ type: 'text', text: `Folder moved.` }] };
                } catch (e: any) { return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true }; }
            }
        );

        mcpServer.tool('delete_folder',
            'Удаляет папку',
            { folder_id: z.string() },
            async ({ folder_id }) => {
                try {
                    storageService.deleteFolder(folder_id);
                    logAction('BOT', 'DELETE_FOLDER', { id: folder_id });
                    wsService.broadcastUpdate();
                    return { content: [{ type: 'text', text: `Folder deleted.` }] };
                } catch (e: any) { return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true }; }
            }
        );

        mcpServer.tool('create_task',
            'Создает новую задачу для бота',
            { title: z.string(), status: z.enum(['completed', 'pending', 'failed', 'in_progress']), time: z.string(), date: z.string(), description: z.string() },
            async ({ title, status, time, date, description }) => {
                try {
                    const task = storageService.createTask(title, status, time, date, description);
                    logAction('BOT', 'CREATE_TASK', { id: task.id, title });
                    wsService.broadcastUpdate();
                    return { content: [{ type: 'text', text: `Task created. ID: ${task.id}` }] };
                } catch (e: any) { return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true }; }
            }
        );

        mcpServer.tool('update_task',
            'Обновляет задачу',
            { id: z.string(), title: z.string().optional(), status: z.enum(['completed', 'pending', 'failed', 'in_progress']).optional(), time: z.string().optional(), date: z.string().optional(), description: z.string().optional() },
            async ({ id, title, status, time, date, description }) => {
                try {
                    const updates: any = {};
                    if (title) updates.title = title;
                    if (status) updates.status = status;
                    if (time) updates.time = time;
                    if (date) updates.date = date;
                    if (description) updates.description = description;
                    const task = storageService.updateTask(id, updates);
                    logAction('BOT', 'UPDATE_TASK', { id: task.id, title: task.title });
                    wsService.broadcastUpdate();
                    return { content: [{ type: 'text', text: `Task updated.` }] };
                } catch (e: any) { return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true }; }
            }
        );

        mcpServer.tool('delete_task',
            'Удаляет задачу',
            { id: z.string() },
            async ({ id }) => {
                try {
                    storageService.deleteTask(id);
                    logAction('BOT', 'DELETE_TASK', { id });
                    wsService.broadcastUpdate();
                    return { content: [{ type: 'text', text: `Task deleted.` }] };
                } catch (e: any) { return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true }; }
            }
        );

        mcpServer.tool('create_document',
            'Создает новый документ',
            { title: z.string(), content: z.string(), folder_id: z.string().optional(), extension: z.string().optional() },
            async ({ title, content, folder_id, extension }) => {
                try {
                    const doc = storageService.createDocument(title, content, folder_id || INBOX_FOLDER_ID, extension || '.html');
                    logAction('BOT', 'CREATE_DOCUMENT', { id: doc.id, title });
                    wsService.broadcastUpdate();
                    return { content: [{ type: 'text', text: `Document created. ID: ${doc.id}` }] };
                } catch (e: any) { return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true }; }
            }
        );

        mcpServer.tool('update_document',
            'Создает новую ревизию документа',
            { file_id: z.string(), new_content: z.string() },
            async ({ file_id, new_content }) => {
                try {
                    const doc = storageService.updateDocument(file_id, new_content);
                    logAction('BOT', 'UPDATE_DOCUMENT', { id: doc.id });
                    wsService.broadcastUpdate();
                    return { content: [{ type: 'text', text: `Document updated. Revision: ${doc.currentRevisionId}` }] };
                } catch (e: any) { return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true }; }
            }
        );

        mcpServer.tool('rename_document',
            'Переименовывает документ',
            { file_id: z.string(), new_title: z.string() },
            async ({ file_id, new_title }) => {
                try {
                    const doc = storageService.renameDocument(file_id, new_title);
                    logAction('BOT', 'RENAME_DOCUMENT', { id: doc.id });
                    wsService.broadcastUpdate();
                    return { content: [{ type: 'text', text: `Document renamed.` }] };
                } catch (e: any) { return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true }; }
            }
        );

        mcpServer.tool('move_document',
            'Перемещает документ',
            { file_id: z.string(), dest_folder_id: z.string() },
            async ({ file_id, dest_folder_id }) => {
                try {
                    const doc = storageService.moveDocument(file_id, dest_folder_id);
                    logAction('BOT', 'MOVE_DOCUMENT', { id: doc.id, destFolderId: dest_folder_id });
                    wsService.broadcastUpdate();
                    return { content: [{ type: 'text', text: `Document moved.` }] };
                } catch (e: any) { return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true }; }
            }
        );

        mcpServer.tool('delete_document',
            'Удаляет документ',
            { file_id: z.string() },
            async ({ file_id }) => {
                try {
                    storageService.deleteDocument(file_id);
                    logAction('BOT', 'DELETE_DOCUMENT', { id: file_id });
                    wsService.broadcastUpdate();
                    return { content: [{ type: 'text', text: `Document deleted.` }] };
                } catch (e: any) { return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true }; }
            }
        );

        mcpServer.tool('read_document',
            'Читает содержимое',
            { file_id: z.string() },
            async ({ file_id }) => {
                try {
                    logAction('BOT', 'READ_DOCUMENT', { file_id });
                    return { content: [{ type: 'text', text: storageService.readDocumentContent(file_id) }] };
                } catch (e: any) { return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true }; }
            }
        );

        mcpServer.tool('get_folder_files',
            'Возвращает список файлов в папке с их URL для использования в HTML',
            { folder_id: z.string() },
            async ({ folder_id }) => {
                try {
                    const documents = storageService.listDocuments();
                    const folderFiles = documents.filter(d => d.folderId === folder_id);
                    const filesWithUrls = folderFiles.map(doc => ({
                        id: doc.id,
                        title: doc.title,
                        extension: doc.revisions.find(r => r.id === doc.currentRevisionId)?.extension,
                        url: `http://localhost:3001/files/${doc.id}`
                    }));
                    return { content: [{ type: 'text', text: JSON.stringify(filesWithUrls, null, 2) }] };
                } catch (e: any) { return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true }; }
            }
        );

        pluginManager.initializeMcpTools(mcpServer, () => wsService.broadcastUpdate());

        // Register Compland MCP tools
        for (const tool of vmMcpTools) {
            mcpServer.tool(
                tool.name,
                tool.description,
                tool.schema.shape,
                async (params: any) => {
                    const result = await tool.handler(params);
                    return result;
                }
            );
        }
    }

    async handleSseConnection(req: Request, res: Response) {
        logAction('BOT', 'CONNECT_MCP_SSE', {});
        
        try {
            const mcpServer = new McpServer({
                name: 'docland-mcp',
                version: '1.2.0'
            });
            this.registerTools(mcpServer);

            const protocol = req.protocol || 'http';
            const host = req.headers.host || 'localhost:3001';
            const messageUrl = `${protocol}://${host}/mcp/messages`;

            const transport = new SSEServerTransport(messageUrl, res);
            await mcpServer.connect(transport);
            
            if (transport.sessionId) {
                activeTransports.set(transport.sessionId, transport);
            }
            
            res.on('close', () => {
                logAction('BOT', 'DISCONNECT_MCP_SSE', { sessionId: transport.sessionId });
                if (transport.sessionId) {
                    activeTransports.delete(transport.sessionId);
                }
            });
        } catch (e) {
            console.error("Error in SSE connection:", e);
            res.status(500).end();
        }
    }

    async handleMessage(req: Request, res: Response) {
        const sessionId = req.query.sessionId as string;
        
        if (!sessionId) {
            console.error("Missing sessionId in MCP post request");
            return res.status(400).send('Missing sessionId parameter');
        }

        const transport = activeTransports.get(sessionId);
        
        if (transport) {
            try {
                await transport.handlePostMessage(req, res);
            } catch (e) {
                console.error("Error handling POST message:", e);
                res.status(500).send('Internal Server Error');
            }
        } else {
            console.error(`SSE Transport not found for sessionId: ${sessionId}`);
            res.status(404).send('SSE Transport not found for this sessionId');
        }
    }
}

export const mcpService = new MCPService();
