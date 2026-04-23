import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storageService, INBOX_FOLDER_ID } from '../services/storage.service.js';
import { wsService } from '../services/websocket.service.js';
import { logAction } from '../logger.js';
import { pluginManager } from '../plugins/index.js';

const router = Router();

const tempUploadDir = path.join(process.cwd(), 'temp_uploads');
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

router.post('/tasks', (req, res) => {
    try {
        const { title, status, time, date, description, scenarioId, linkedDocumentId, assignee } = req.body;
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
            assignee
        );
        logAction('USER', 'CREATE_TASK', { id: task.id, title });
        wsService.broadcastUpdate();
        res.status(201).json(task);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/tasks/:id', (req, res) => {
    try {
        const task = storageService.updateTask(req.params.id, req.body);
        logAction('USER', 'UPDATE_TASK', { id: task.id, title: task.title });
        wsService.broadcastUpdate();
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

export default router;
