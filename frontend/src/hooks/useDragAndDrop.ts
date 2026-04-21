import { useState } from 'react';
import type { DragEvent } from 'react';
import { api } from '../api.js';
import type { Document } from '../types/index.js';

export function useDragAndDrop({ fetchWorkspace, documents }: { fetchWorkspace: () => void, documents: Document[] }) {
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleDragOver = (e: DragEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverId(id);
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverId(null);
    };

    const handleDrop = async (e: DragEvent, destFolderId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverId(null);
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await handleFileUpload(e.dataTransfer.files, destFolderId);
            return;
        }

        const data = e.dataTransfer.getData('application/json');
        if (!data) return;

        try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'multi') {
                for (const id of parsed.ids) {
                    const isDoc = documents.some(d => d.id === id);
                    if (isDoc) {
                        const doc = documents.find(d => d.id === id);
                        if (doc && doc.folderId !== destFolderId) {
                            await api.moveDocument(id, destFolderId);
                        }
                    } else {
                        if (id !== destFolderId) {
                            await api.moveFolder(id, destFolderId);
                        }
                    }
                }
                fetchWorkspace();
            } else if (parsed.type === 'document') {
                if (parsed.folderId === destFolderId) return;
                await api.moveDocument(parsed.id, destFolderId);
                fetchWorkspace();
            } else if (parsed.type === 'folder') {
                if (parsed.id === destFolderId) return;
                await api.moveFolder(parsed.id, destFolderId);
                fetchWorkspace();
            }
        } catch (err) {
            console.error('Drop error:', err);
        }
    };

    const handleFileUpload = async (files: FileList | File[], destFolderId: string) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const path = (file as any).webkitRelativePath || file.name;
                await api.uploadFile(file, destFolderId === 'inbox' || destFolderId === 'storage' ? 'inbox' : destFolderId, path);
            }
            await fetchWorkspace();
        } catch (e) {
            console.error('Upload failed', e);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDragStart = (e: DragEvent, id: string, selectedIds: string[]) => {
        const idsToMove = selectedIds.includes(id) ? selectedIds : [id];
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'multi', ids: idsToMove }));
    };

    return {
        dragOverId,
        uploading,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleDragStart,
        handleFileUpload
    };
}
