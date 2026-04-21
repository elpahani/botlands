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
    status: 'completed' | 'pending' | 'failed' | 'in_progress';
    time: string;
    date: string; // ISO Date string yyyy-MM-dd
    description: string;
}

export interface Database {
    documents: Record<string, Document>;
    folders: Record<string, Folder>;
    tasks: Record<string, Task>;
}
