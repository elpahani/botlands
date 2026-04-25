import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { join } from 'path';
import fs, { readFileSync } from 'fs';
import { storageService, INBOX_FOLDER_ID } from '../services/storage.service.js';
import { wsService } from '../services/websocket.service.js';
import { logAction } from '../logger.js';
import { pluginManager } from '../plugins/index.js';

const router = Router();

const tempUploadDir = join(process.cwd(), 'temp_uploads');
if (!fs.existsSync(tempUploadDir)) fs.mkdirSync(tempUploadDir, { recursive: true });

const upload = multer({ 
    storage: multer.diskStorage({
        destination: tempUploadDir,
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${file.originalname}`);
        }
    })
});

// Workspace
router.get('/workspace', (req, res) => {
    const docs = storageService.listDocuments();
    const folders = storageService.listFolders();
    const tasks = storageService.listTasks();
    res.json({ documents: docs, folders, tasks });
});

// Folders
router.get('/tasks', (req, res) => {
    res.json(storageService.listTasks());
});

router.get('/tasks/:id', (req, res) => {
    try {
        const tasks = storageService.listTasks();
        const task = tasks.find(t => t.id === req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json(task);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/tasks', (req, res) => {
    try {
        const { title, status, time, date, description, scenarioId, linkedDocumentId, assignee, categories } = req.body;
        const now = new Date().toISOString();
        const defaultTime = time || now.split('T')[1]?.slice(0,5) || '00:00';
        const defaultDate = date || now.split('T')[0] || now.slice(0,10);
        const task = storageService.createTask(
            title, 
            status || 'waiting', 
            defaultTime, 
            defaultDate, 
            description || '',
            scenarioId,
            linkedDocumentId,
            assignee,
            req.body.programId
        );
        if (categories) {
            storageService.updateTaskCategories(task.id, categories);
        }
        logAction('USER', 'CREATE_TASK', { id: task.id, title });
        wsService.broadcastTaskEvent('task:created', task);
        res.status(201).json(task);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/tasks/:id', async (req, res) => {
    try {
        const { status, programId } = req.body;
        const task = storageService.updateTask(req.params.id, req.body);
        
        // Auto-run Compland program when task becomes active
        if (status === 'active' && task.programId) {
            console.log(`[AutoRun] Task ${task.id} activated, running program ${task.programId}`);
            // Lazy import to avoid circular dependency
            const { runProgram: runComplandProgram } = await import('../compland/executor.js');
            const { getProgram } = await import('../compland/project-manager.js');
            const program = getProgram(task.programId);
            if (program) {
                runComplandProgram(program).catch((err: any) => {
                    console.error('[AutoRun] Failed:', err);
                });
            } else {
                console.error(`[AutoRun] Program ${task.programId} not found`);
            }
        }
        
        logAction('USER', 'UPDATE_TASK', { id: task.id, title: task.title });
        wsService.broadcastUpdate();
        wsService.broadcastTaskEvent('task:updated', task);
        res.json(task);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/tasks/:id', (req, res) => {
    try {
        storageService.deleteTask(req.params.id);
        logAction('USER', 'DELETE_TASK', { id: req.params.id });
        wsService.broadcastUpdate();
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Categories
router.get('/categories', (req, res) => {
    try {
        const categories = storageService.getCategories();
        res.json(categories);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/tasks/:id/categories', (req, res) => {
    try {
        const { categories } = req.body;
        const task = storageService.updateTaskCategories(req.params.id, categories || []);
        logAction('USER', 'UPDATE_TASK_CATEGORIES', { id: task.id, categories });
        wsService.broadcastUpdate();
        res.json(task);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/folders', (req, res) => {
    try {
        const { name, parentId } = req.body;
        const folder = storageService.createFolder(name, parentId);
        logAction('USER', 'CREATE_FOLDER', { id: folder.id, name });
        wsService.broadcastUpdate();
        res.status(201).json(folder);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/folders/:id/move', (req, res) => {
    try {
        const { destFolderId } = req.body;
        const folder = storageService.moveFolder(req.params.id, destFolderId);
        logAction('USER', 'MOVE_FOLDER', { id: folder.id, destFolderId });
        wsService.broadcastUpdate();
        res.json(folder);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/folders/:id', (req, res) => {
    try {
        storageService.deleteFolder(req.params.id);
        logAction('USER', 'DELETE_FOLDER', { id: req.params.id });
        wsService.broadcastUpdate();
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Documents
router.get('/documents/:id', (req, res) => {
    const doc = storageService.getDocument(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
});

// Create document from JSON content
router.post('/documents', (req, res) => {
    try {
        const { title, content, folderId, extension } = req.body;
        const targetFolder = folderId || INBOX_FOLDER_ID;
        const ext = extension || '.html';
        
        const doc = storageService.createDocument(
            title || 'Untitled',
            content || '',
            targetFolder,
            ext
        );
        
        logAction('USER', 'CREATE_DOCUMENT', { id: doc.id, title: doc.title, folderId: doc.folderId });
        wsService.broadcastUpdate();
        res.status(201).json(doc);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/documents/upload', upload.single('file'), (req, res) => {
    try {
        const folderId = req.body.folderId || INBOX_FOLDER_ID;
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({ error: 'file is required' });
        }
        
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const ext = path.extname(originalName).toLowerCase();
        
        const doc = storageService.createDocument(originalName, file.path, folderId, ext, true);
        
        logAction('USER', 'UPLOAD_DOCUMENT', { id: doc.id, title: originalName, folderId: doc.folderId });
        wsService.broadcastUpdate();
        
        res.status(201).json(doc);
    } catch (e: any) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: e.message });
    }
});

router.post('/documents/:id/move', (req, res) => {
    try {
        const { destFolderId } = req.body;
        const doc = storageService.moveDocument(req.params.id, destFolderId);
        logAction('USER', 'MOVE_DOCUMENT', { id: doc.id, destFolderId });
        wsService.broadcastUpdate();
        res.json(doc);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/documents/:id', (req, res) => {
    try {
        storageService.deleteDocument(req.params.id);
        logAction('USER', 'DELETE_DOCUMENT', { id: req.params.id });
        wsService.broadcastUpdate();
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Document File Access
router.get('/files/:id', (req, res) => {
    try {
        const doc = storageService.getDocument(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Document not found' });
        const filePath = storageService.getFilePath(req.params.id, doc.currentRevisionId, 'original');
        res.sendFile(filePath);
    } catch (e: any) {
        res.status(404).json({ error: e.message });
    }
});

router.get('/documents/:id/revisions/:revId/html', (req, res) => {
    try {
        const content = storageService.readDocumentContent(req.params.id, req.params.revId);
        res.send(content);
    } catch (e: any) {
        res.status(404).json({ error: e.message });
    }
});

router.get('/documents/:id/revisions/:revId/content', (req, res) => {
    try {
        const filePath = storageService.getFilePath(req.params.id, req.params.revId, 'original');
        res.sendFile(filePath);
    } catch (e: any) {
        res.status(404).json({ error: e.message });
    }
});

router.get('/documents/:id/revisions/:revId/preview', async (req, res) => {
    try {
        const filePath = storageService.getFilePath(req.params.id, req.params.revId, 'original');
        
        const doc = storageService.getDocument(req.params.id);
        const rev = doc?.revisions.find(r => r.id === req.params.revId);
        if (!doc || !rev) {
            return res.status(404).send('Document or revision not found');
        }
        
        // This used to use mammoth but mammoth was removed. Actually, I removed mammoth in a previous step!
        // The preview logic for docx is handled entirely on the frontend using docx-preview.
        // Wait, did the user want mammoth preview back?
        // No, the frontend `isDocx` block hits `getOriginalUrl`. We don't even need `getPreviewUrl` for docx anymore!
        // But let's check `App.tsx` again to see what hits `getPreviewUrl`.
        res.sendFile(filePath);
    } catch (e: any) {
        res.status(500).send(e.message);
    }
});

router.get('/documents/:id/revisions/:revId/pdf', (req, res) => {
    try {
        const filePath = storageService.getFilePath(req.params.id, req.params.revId, 'pdf');
        res.sendFile(filePath);
    } catch (e: any) {
        res.status(404).json({ error: e.message });
    }
});

// Plugins
router.post('/documents/:id/execute-plugin', async (req, res) => {
    try {
        const { pluginId, data } = req.body;
        const file_id = req.params.id;
        const doc = storageService.getDocument(file_id);
        if (!doc) return res.status(404).json({ error: 'Document not found' });
        
        const plugin = pluginManager.getPlugin(pluginId);
        if (plugin && plugin.execute) {
            const result = await plugin.execute(file_id, doc, 'USER', data || {});
            res.json({ success: true, result });
        } else {
            res.status(500).json({ error: `Plugin ${pluginId} not available or does not support manual execution` });
        }
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// ─── Workland API ───

// Scenarios
router.get('/scenarios', (req, res) => {
    try {
        const scenarios = storageService.listScenarios();
        res.json(scenarios);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/scenarios', (req, res) => {
    try {
        const { title, description, color } = req.body;
        const scenario = storageService.createScenario(title, description, color);
        res.json(scenario);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/scenarios/:id', (req, res) => {
    try {
        const scenario = storageService.updateScenario(req.params.id, req.body);
        res.json(scenario);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/scenarios/:id', (req, res) => {
    try {
        storageService.deleteScenario(req.params.id);
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Workland Tasks (расширенные)
router.get('/workland-tasks', (req, res) => {
    try {
        const tasks = storageService.listTasks().filter((t: any) => t.scenarioId);
        res.json(tasks);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/workland-tasks', (req, res) => {
    try {
        const { scenarioId, title, description, linkedDocumentId, assignee } = req.body;
        const task = storageService.createWorklandTask(scenarioId, title, description, linkedDocumentId, assignee);
        res.json(task);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/workland-tasks/:id/status', (req, res) => {
    try {
        const { status } = req.body;
        const task = storageService.updateTaskStatus(req.params.id, status);
        res.json(task);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

import { createCompTask, executeTask, getTask as getCompTask, getTaskLogs, listTasks as listCompTasks, stopTask } from '../compland/task-manager.js';

router.post('/comp/execute', async (req, res) => {
    try {
        const { title, scriptContent, language, dependencies } = req.body;
        const task = createCompTask(title, scriptContent, language, dependencies || []);
        await executeTask(task.id);
        res.json(task);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/comp/tasks', (req, res) => {
    try {
        const tasks = listCompTasks();
        res.json(tasks);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/comp/tasks/:id', (req, res) => {
    try {
        const task = getCompTask(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json(task);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/comp/tasks/:id/logs', (req, res) => {
    try {
        const logs = getTaskLogs(req.params.id);
        res.json({ logs });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/comp/tasks/:id/stop', (req, res) => {
    try {
        stopTask(req.params.id);
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

import { listPrograms, getProgram, createProgram, deleteProgram, renameProgram } from '../compland/project-manager.js';
import { readProgramFile, writeProgramFile, deleteProgramFile } from '../compland/file-service.js';
import { runProgram, stopProgram, isRunning, getRunningProcesses, complandEventEmitter } from '../compland/executor.js';

const COMPLAND_ROOT = process.env.COMPLAND_BASE_PATH || '/app/compland';

// Compland Programs
router.get('/comp/programs', (req, res) => {
    try {
        const programs = listPrograms();
        res.json(programs);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/comp/programs', (req, res) => {
    try {
        const { name } = req.body;
        const program = createProgram(name);
        res.json(program);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/comp/programs/:id', (req, res) => {
    try {
        const program = getProgram(req.params.id);
        if (!program) return res.status(404).json({ error: 'Program not found' });
        res.json(program);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/comp/programs/:id', (req, res) => {
    try {
        const { name } = req.body;
        const program = renameProgram(req.params.id, name);
        if (!program) return res.status(404).json({ error: 'Program not found' });
        res.json(program);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/comp/programs/:id', (req, res) => {
    try {
        deleteProgram(req.params.id);
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Compland Files
// File routes using router.use for catch-all
router.use('/comp/programs/:id/files', (req, res) => {
    try {
        const filePath = req.path.replace(/^\/+/, '');
        if (req.method === 'GET') {
            const content = readProgramFile(req.params.id, filePath);
            if (content === null) return res.status(404).json({ error: 'File not found' });
            res.json({ content });
        } else if (req.method === 'PUT') {
            const { content } = req.body;
            const success = writeProgramFile(req.params.id, filePath, content);
            if (!success) return res.status(500).json({ error: 'Failed to write file' });
            res.json({ success: true });
        } else if (req.method === 'DELETE') {
            const success = deleteProgramFile(req.params.id, filePath);
            if (!success) return res.status(404).json({ error: 'File not found' });
            res.json({ success: true });
        } else {
            res.status(405).send('Method Not Allowed');
        }
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Compland Run
router.post('/comp/programs/:id/run', async (req, res) => {
    try {
        const program = getProgram(req.params.id);
        if (!program) return res.status(404).json({ error: 'Program not found' });
        const result = await runProgram(program);
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/comp/programs/:id/stop', (req, res) => {
    try {
        const success = stopProgram(req.params.id);
        res.json({ success });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Compland running processes
router.get('/comp/running', (req, res) => {
    try {
        const processes = getRunningProcesses();
        res.json(processes);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Compland status
router.get('/comp/programs/:id/status', (req, res) => {
    try {
        const program = getProgram(req.params.id);
        if (!program) return res.status(404).json({ error: 'Program not found' });
        const running = isRunning(req.params.id);
        const logPath = join(COMPLAND_ROOT, req.params.id, 'compland.log');
        let logs = '';
        try {
            logs = readFileSync(logPath, 'utf-8');
        } catch { /* no log yet */ }
        res.json({ running, logs });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
