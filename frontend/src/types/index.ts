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
    folderId: string;
}

export interface Folder {
    id: string;
    name: string;
    parentId: string | null;
}

export interface WorkspaceData {
    documents: Document[];
    folders: Folder[];
    tasks?: any[];
}
