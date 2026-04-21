import axios from 'axios';
import type { WorkspaceData, Document, Folder, Revision } from './types/index.js';

const API_BASE = 'http://localhost:3001/api';

export type { WorkspaceData, Document, Folder, Revision };

export const api = {
    getWorkspace: async (): Promise<WorkspaceData> => {
        const res = await axios.get(`${API_BASE}/workspace`, {
            params: { t: Date.now() }
        });
        return res.data;
    },
    createFolder: async (name: string, parentId: string | null = null): Promise<Folder> => {
        const res = await axios.post(`${API_BASE}/folders`, { name, parentId });
        return res.data;
    },
    moveDocument: async (docId: string, destFolderId: string): Promise<Document> => {
        const res = await axios.post(`${API_BASE}/documents/${docId}/move`, { destFolderId });
        return res.data;
    },
    moveFolder: async (folderId: string, destFolderId: string): Promise<Folder> => {
        const res = await axios.post(`${API_BASE}/folders/${folderId}/move`, { destFolderId });
        return res.data;
    },
    deleteDocument: async (id: string): Promise<void> => {
        await axios.delete(`${API_BASE}/documents/${id}`);
    },
    deleteFolder: async (id: string): Promise<void> => {
        await axios.delete(`${API_BASE}/folders/${id}`);
    },
    getDocument: async (id: string): Promise<Document> => {
        const res = await axios.get(`${API_BASE}/documents/${id}`);
        return res.data;
    },
    getHtmlUrl: (id: string, revId: string) => `${API_BASE}/documents/${id}/revisions/${revId}/html`,
    getOriginalUrl: (id: string, revId: string) => `${API_BASE}/documents/${id}/revisions/${revId}/content`,
    getPreviewUrl: (id: string, revId: string) => `${API_BASE}/documents/${id}/revisions/${revId}/preview`,
    getPdfUrl: (id: string, revId: string) => `${API_BASE}/documents/${id}/revisions/${revId}/pdf`,
    uploadFile: async (file: File, folderId: string = 'inbox', path: string = ''): Promise<Document> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderId', folderId);
        formData.append('title', path ? path : file.name); // Store full relative path in title if provided
        
        const res = await axios.post(`${API_BASE}/documents/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    },
    executePlugin: async (docId: string, pluginId: string, data?: any) => {
        const res = await axios.post(`${API_BASE}/documents/${docId}/execute-plugin`, { pluginId, data });
        return res.data;
    },

    // Tasks
    getTasks: async () => {
        const res = await axios.get(`${API_BASE}/tasks`);
        return res.data;
    },
    createTask: async (task: { title: string, status: string, time: string, date: string, description: string }) => {
        const res = await axios.post(`${API_BASE}/tasks`, task);
        return res.data;
    },
    updateTask: async (id: string, updates: any) => {
        const res = await axios.put(`${API_BASE}/tasks/${id}`, updates);
        return res.data;
    },
    deleteTask: async (id: string) => {
        const res = await axios.delete(`${API_BASE}/tasks/${id}`);
        return res.data;
    }
};
