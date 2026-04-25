import { useState, useCallback, useEffect } from 'react';
import { api } from '../api.js';
import type { Document, Folder, Task } from '../types/index.js';
import { io } from 'socket.io-client';


export function useWorkspace() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string>('inbox');
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

    const fetchWorkspace = useCallback(async () => {
        try {
            const data = await api.getWorkspace();
            setDocuments(data.documents || []);
            setFolders(data.folders || []);
            setTasks(data.tasks || []);
            
            setSelectedDoc(prevSelected => {
                if (!prevSelected) return null;
                const updated = data.documents.find(d => d.id === prevSelected.id);
                if (updated) {
                    if (!updated.revisions.find(r => r.id === prevSelected.currentRevisionId)) {
                        return { ...updated, currentRevisionId: updated.currentRevisionId };
                    }
                    return { ...updated, currentRevisionId: prevSelected.currentRevisionId };
                }
                return null;
            });
        } catch (e) {
            console.error("Error fetching workspace", e);
        }
    }, []);

    useEffect(() => {
        fetchWorkspace();

        const socket = io({ transports: ['websocket', 'polling'] });
        
        socket.on('workspace_updated', () => {
            fetchWorkspace();
        });
        
        socket.on('task:created', () => {
            fetchWorkspace();
        });
        
        socket.on('task:updated', () => {
            fetchWorkspace();
        });
        
        socket.on('task:deleted', () => {
            fetchWorkspace();
        });

        return () => {
            socket.disconnect();
        };
    }, [fetchWorkspace]);

    return {
        documents,
        folders,
        tasks,
        currentFolderId,
        setCurrentFolderId,
        selectedDoc,
        setSelectedDoc,
        fetchWorkspace
    };
}
