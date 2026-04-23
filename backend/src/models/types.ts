export interface Revision {
    id: string;
    timestamp: string;
    hasPdf: boolean;
    extension?: string;
}

export interface Document {
    id: string;
    title: string;
    revisions: Revision[];
    currentRevisionId: string;
    folderId: string; // ID of the folder where this document is located
}

export interface Folder {
    id: string;
    name: string;
    parentId: string | null; // null means root
}

export interface Task {
    id: string;
    title: string;
    status: 'completed' | 'pending' | 'failed' | 'in_progress' | 'inactive' | 'waiting' | 'active' | 'paused' | 'error';
    time: string;
    date: string;
    description: string;
    scenarioId?: string;
    linkedDocumentId?: string;
    assignee?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Scenario {
    id: string;
    title: string;
    description: string;
    status: 'inactive' | 'active' | 'paused' | 'completed' | 'error';
    taskIds: string[];
    createdAt: string;
    updatedAt: string;
    color?: string;
}

export interface Database {
    documents: Record<string, Document>;
    folders: Record<string, Folder>;
    tasks: Record<string, Task>;
    scenarios?: Record<string, Scenario>;
}
