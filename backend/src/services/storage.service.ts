import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import type { Document, Folder, Database, Task } from '../models/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../../data');
const METADATA_FILE = path.join(DATA_DIR, 'metadata.json');
const FILES_DIR = path.join(DATA_DIR, 'files');

export const INBOX_FOLDER_ID = 'inbox';
export const STORAGE_FOLDER_ID = 'storage';

export class StorageService {
    constructor() {
        this.initialize();
    }

    private initialize() {
        console.log(`[Storage] DATA_DIR: ${DATA_DIR}`);
        console.log(`[Storage] METADATA_FILE: ${METADATA_FILE}`);
        
        if (!fs.existsSync(DATA_DIR)) {
            console.log('[Storage] Creating DATA_DIR...');
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        if (!fs.existsSync(FILES_DIR)) {
            console.log('[Storage] Creating FILES_DIR...');
            fs.mkdirSync(FILES_DIR, { recursive: true });
        }
        if (!fs.existsSync(METADATA_FILE)) {
            console.log('[Storage] Creating new metadata.json (first run or new workspace)');
            fs.writeFileSync(METADATA_FILE, JSON.stringify({ 
                documents: {},
                folders: {
                    [INBOX_FOLDER_ID]: { id: INBOX_FOLDER_ID, name: 'Buffer', parentId: null },
                    [STORAGE_FOLDER_ID]: { id: STORAGE_FOLDER_ID, name: 'Storage', parentId: null }
                },
                tasks: {}
            }, null, 2));
        } else {
            console.log('[Storage] Found existing metadata.json, loading data...');
            const stats = fs.statSync(METADATA_FILE);
            console.log(`[Storage] metadata.json size: ${stats.size} bytes`);
        }
    }

    private readDB(): Database {
        const data = fs.readFileSync(METADATA_FILE, 'utf-8');
        const db = JSON.parse(data);
        let changed = false;

        if (!db.folders) db.folders = {};
        if (!db.documents) db.documents = {};
        if (!db.tasks) db.tasks = {};

        if (!db.folders[INBOX_FOLDER_ID]) {
            db.folders[INBOX_FOLDER_ID] = { id: INBOX_FOLDER_ID, name: 'Buffer', parentId: null };
            changed = true;
        }
        if (!db.folders[STORAGE_FOLDER_ID]) {
            db.folders[STORAGE_FOLDER_ID] = { id: STORAGE_FOLDER_ID, name: 'Storage', parentId: null };
            changed = true;
        }

        Object.values(db.folders).forEach((f: any) => {
            if (f.parentId === null && f.id !== INBOX_FOLDER_ID && f.id !== STORAGE_FOLDER_ID) {
                f.parentId = STORAGE_FOLDER_ID;
                changed = true;
            }
        });

        Object.values(db.documents).forEach((doc: any) => {
            if (!doc.folderId) {
                doc.folderId = INBOX_FOLDER_ID;
                changed = true;
            }
        });

        if (changed) this.writeDB(db);
        return db as Database;
    }

    private writeDB(db: Database) {
        fs.writeFileSync(METADATA_FILE, JSON.stringify(db, null, 2));
    }

    listDocuments(): Document[] {
        return Object.values(this.readDB().documents);
    }

    getDocument(id: string): Document | undefined {
        return this.readDB().documents[id];
    }

    getFolder(id: string): Folder | undefined {
        return this.readDB().folders[id];
    }

    listFolders(): Folder[] {
        return Object.values(this.readDB().folders);
    }

    createFolder(name: string, parentId: string | null = null): Folder {
        const db = this.readDB();
        const id = uuidv4();
        const newFolder: Folder = { id, name, parentId };
        db.folders[id] = newFolder;
        this.writeDB(db);
        return newFolder;
    }

    moveDocument(docId: string, destFolderId: string): Document {
        const db = this.readDB();
        const doc = db.documents[docId];
        if (!doc) throw new Error('Document not found');
        if (!db.folders[destFolderId]) throw new Error('Destination folder not found');
        
        const ext = path.extname(doc.title);
        const base = path.basename(doc.title, ext);
        let uniqueTitle = doc.title;
        let counter = 2;
        
        const exists = (name: string) => {
            return Object.values(db.documents).some(d => d.id !== docId && d.folderId === destFolderId && d.title === name);
        };

        while (exists(uniqueTitle)) {
            uniqueTitle = `${base}(${counter})${ext}`;
            counter++;
        }
        
        doc.title = uniqueTitle;
        doc.folderId = destFolderId;
        this.writeDB(db);
        return doc;
    }

    moveFolder(folderId: string, destFolderId: string): Folder {
        const db = this.readDB();
        const folder = db.folders[folderId];
        if (!folder) throw new Error('Folder not found');
        if (!db.folders[destFolderId]) throw new Error('Destination folder not found');
        if (folderId === destFolderId) throw new Error('Cannot move folder into itself');
        if (folderId === INBOX_FOLDER_ID || folderId === STORAGE_FOLDER_ID) throw new Error('Cannot move system folders');
        
        let curr: Folder | undefined = db.folders[destFolderId];
        while (curr && curr.parentId) {
            if (curr.parentId === folderId) throw new Error('Cannot move a folder into its own subfolder');
            curr = db.folders[curr.parentId];
        }
        
        folder.parentId = destFolderId;
        this.writeDB(db);
        return folder;
    }

    renameFolder(folderId: string, newName: string): Folder {
        const db = this.readDB();
        const folder = db.folders[folderId];
        if (!folder) throw new Error('Folder not found');
        
        folder.name = newName;
        this.writeDB(db);
        return folder;
    }

    renameDocument(docId: string, newTitle: string): Document {
        const db = this.readDB();
        const doc = db.documents[docId];
        if (!doc) throw new Error('Document not found');
        
        doc.title = newTitle;
        this.writeDB(db);
        return doc;
    }

    createDocument(title: string, content: Buffer | string, folderId: string = INBOX_FOLDER_ID, extension: string = '.html', isTempFilePath: boolean = false): Document {
        const db = this.readDB();
        
        const ext = extension || path.extname(title).toLowerCase() || '.html';
        const base = path.basename(title, ext);
        let uniqueTitle = title;
        let counter = 2;
        
        const exists = (name: string) => {
            return Object.values(db.documents).some(d => d.folderId === folderId && d.title === name);
        };

        while (exists(uniqueTitle)) {
            uniqueTitle = `${base}(${counter})${ext}`;
            counter++;
        }

        const docId = uuidv4();
        const revId = uuidv4();
        
        const docDir = path.join(FILES_DIR, docId);
        fs.mkdirSync(docDir, { recursive: true });
        
        const finalFilePath = path.join(docDir, `${revId}${ext}`);
        
        if (isTempFilePath && typeof content === 'string') {
            fs.copyFileSync(content, finalFilePath);
            fs.unlinkSync(content);
        } else {
            const buf = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;
            fs.writeFileSync(finalFilePath, buf);
        }
        
        const newDoc: Document = {
            id: docId,
            title: uniqueTitle,
            revisions: [{
                id: revId,
                timestamp: new Date().toISOString(),
                hasPdf: false,
                extension: ext
            }],
            currentRevisionId: revId,
            folderId
        };
        
        db.documents[docId] = newDoc;
        this.writeDB(db);
        return newDoc;
    }

    updateDocument(id: string, content: Buffer | string, extension?: string): Document {
        const db = this.readDB();
        const doc = db.documents[id];
        if (!doc) throw new Error('Document not found');
        
        const revId = uuidv4();
        const docDir = path.join(FILES_DIR, id);
        
        const ext = extension || doc.revisions.find(r => r.id === doc.currentRevisionId)?.extension || '.html';
        const buf = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;
        fs.writeFileSync(path.join(docDir, `${revId}${ext}`), buf);
        
        doc.revisions.push({
            id: revId,
            timestamp: new Date().toISOString(),
            hasPdf: false,
            extension: ext
        });
        doc.currentRevisionId = revId;
        
        this.writeDB(db);
        return doc;
    }

    readDocumentContent(id: string, revId?: string): string {
        const db = this.readDB();
        const doc = db.documents[id];
        if (!doc) throw new Error('Document not found');
        
        const targetRevId = revId || doc.currentRevisionId;
        const rev = doc.revisions.find(r => r.id === targetRevId);
        const ext = rev?.extension || '.html';
        
        const filePath = path.join(FILES_DIR, id, `${targetRevId}${ext}`);
        if (!fs.existsSync(filePath)) throw new Error('Revision file not found');
        
        return fs.readFileSync(filePath, 'utf-8');
    }

    markPdfGenerated(id: string, revId: string) {
        const db = this.readDB();
        const doc = db.documents[id];
        if (!doc) throw new Error('Document not found');
        
        const rev = doc.revisions.find(r => r.id === revId);
        if (!rev) throw new Error('Revision not found');
        
        rev.hasPdf = true;
        this.writeDB(db);
    }

    deleteDocument(id: string) {
        const db = this.readDB();
        if (db.documents[id]) {
            delete db.documents[id];
            this.writeDB(db);
        }
    }

    deleteFolder(id: string) {
        const db = this.readDB();
        if (db.folders[id]) {
            Object.values(db.documents).forEach(doc => {
                if (doc.folderId === id) doc.folderId = INBOX_FOLDER_ID;
            });
            Object.values(db.folders).forEach(f => {
                if (f.parentId === id) f.parentId = null;
            });
            delete db.folders[id];
            this.writeDB(db);
        }
    }

    listTasks(): Task[] {
        return Object.values(this.readDB().tasks);
    }

    getTask(id: string): Task | undefined {
        return this.readDB().tasks[id];
    }

    getScenario(id: string): import('../models/types.js').Scenario | undefined {
        return this.readDB().scenarios?.[id];
    }

    createTask(title: string, status: Task['status'], time: string, date: string, description: string, scenarioId?: string, linkedDocumentId?: string, assignee?: string, programId?: string): Task {
        const db = this.readDB();
        const id = uuidv4();
        const now = new Date().toISOString();
        const newTask: Task = { id, title, status, time, date, description, createdAt: now, updatedAt: now };
        if (scenarioId) newTask.scenarioId = scenarioId;
        if (linkedDocumentId) newTask.linkedDocumentId = linkedDocumentId;
        if (assignee) newTask.assignee = assignee;
        if (programId) newTask.programId = programId;
        db.tasks[id] = newTask;
        this.writeDB(db);
        return newTask;
    }

    updateTask(id: string, updates: Partial<Task>): Task {
        const db = this.readDB();
        const task = db.tasks[id];
        if (!task) throw new Error('Task not found');
        
        const updatedTask = { ...task, ...updates, id }; // Ensure id doesn't change
        db.tasks[id] = updatedTask;
        this.writeDB(db);
        return updatedTask;
    }

    deleteTask(id: string) {
        const db = this.readDB();
        if (db.tasks[id]) {
            delete db.tasks[id];
            this.writeDB(db);
        }
    }

    // ─── Workland Scenarios ───

    listScenarios(): import('../models/types.js').Scenario[] {
        const db = this.readDB();
        return Object.values(db.scenarios || {});
    }

    createScenario(title: string, description: string, color?: string): import('../models/types.js').Scenario {
        const db = this.readDB();
        const id = uuidv4();
        const now = new Date().toISOString();
        const newScenario: any = { 
            id, 
            title, 
            description, 
            status: 'inactive',
            taskIds: [],
            createdAt: now,
            updatedAt: now
        };
        if (color) newScenario.color = color;
        if (!db.scenarios) db.scenarios = {};
        db.scenarios[id] = newScenario;
        this.writeDB(db);
        return newScenario;
    }

    updateScenario(id: string, updates: Partial<import('../models/types.js').Scenario>): import('../models/types.js').Scenario {
        const db = this.readDB();
        if (!db.scenarios) db.scenarios = {};
        const scenario = db.scenarios[id];
        if (!scenario) throw new Error('Scenario not found');
        
        const updated = { ...scenario, ...updates, id, updatedAt: new Date().toISOString() };
        db.scenarios[id] = updated;
        this.writeDB(db);
        return updated;
    }

    deleteScenario(id: string) {
        const db = this.readDB();
        if (db.scenarios?.[id]) {
            delete db.scenarios[id];
            // Удаляем связанные задачи
            Object.values(db.tasks).forEach(task => {
                if (task.scenarioId === id) delete db.tasks[task.id];
            });
            this.writeDB(db);
        }
    }

    // ─── Workland Tasks (расширенные) ───

    createWorklandTask(scenarioId: string, title: string, description: string, linkedDocumentId?: string, assignee?: string): Task {
        const db = this.readDB();
        const id = uuidv4();
        const now = new Date().toISOString();
        const dateParts = now.split('T');
        const newTask: Task = { 
            id, 
            title, 
            status: 'waiting',
            time: (dateParts[1] || '00:00').slice(0,5),
            date: dateParts[0] || now.slice(0,10),
            description,
            createdAt: now,
            updatedAt: now
        };
        if (scenarioId) {
            newTask.scenarioId = scenarioId;
        }
        if (linkedDocumentId) {
            newTask.linkedDocumentId = linkedDocumentId;
        }
        if (assignee) {
            newTask.assignee = assignee;
        }
        db.tasks[id] = newTask;
        
        // Добавляем задачу в сценарий
        if (scenarioId && db.scenarios && db.scenarios[scenarioId]) {
            db.scenarios[scenarioId].taskIds.push(id);
        }
        
        this.writeDB(db);
        return newTask;
    }

    updateTaskStatus(id: string, status: Task['status']): Task {
        const db = this.readDB();
        const task = db.tasks[id];
        if (!task) throw new Error('Task not found');
        
        task.status = status;
        task.updatedAt = new Date().toISOString();
        
        // Обновляем статус сценария если все задачи выполнены
        if (task.scenarioId && db.scenarios) {
            const scenario = db.scenarios[task.scenarioId];
            if (scenario) {
                const tasks = scenario.taskIds
                    .map(tid => db.tasks[tid])
                    .filter((t): t is Task => !!t);
                const allCompleted = tasks.every(t => t.status === 'completed');
                const hasError = tasks.some(t => t.status === 'error');
                
                if (allCompleted) scenario.status = 'completed';
                else if (hasError) scenario.status = 'error';
                else scenario.status = 'active';
            }
        }
        
        this.writeDB(db);
        return task;
    }

    // ─── Categories ───

    getCategories(): { id: string; name: string; color: string; count: number }[] {
        const db = this.readDB();
        const tasks = Object.values(db.tasks) as any[];
        const categoryMap = new Map<string, { count: number; color: string }>();
        
        for (const task of tasks) {
            const cats: any[] = (task.categories || []);
            for (const cat of cats) {
                const catStr = String(cat);
                const existing = categoryMap.get(catStr);
                if (existing) {
                    existing.count++;
                } else {
                    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
                    const idx = catStr.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 8;
                    categoryMap.set(catStr, { count: 1, color: colors[idx]! });
                }
            }
        }
        
        return Array.from(categoryMap.entries()).map(([name, data]: [string, any]) => ({
            id: name,
            name,
            color: data.color,
            count: data.count
        }));
    }

    updateTaskCategories(id: string, categories: string[]): Task {
        const db = this.readDB();
        const task = db.tasks[id];
        if (!task) throw new Error('Task not found');
        
        task.categories = categories;
        task.updatedAt = new Date().toISOString();
        this.writeDB(db);
        return task;
    }

    getFilePath(id: string, revId: string, type: 'original' | 'pdf' = 'original'): string {
        if (type === 'pdf') {
            return path.join(FILES_DIR, id, `${revId}.pdf`);
        }
        const db = this.readDB();
        const doc = db.documents[id];
        const rev = doc?.revisions.find(r => r.id === revId);
        const ext = rev?.extension || '.html';
        return path.join(FILES_DIR, id, `${revId}${ext}`);
    }
}

export const storageService = new StorageService();
