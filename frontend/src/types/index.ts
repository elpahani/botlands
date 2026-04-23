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

// Workland Types
export type TaskStatus = 'inactive' | 'waiting' | 'active' | 'paused' | 'completed' | 'error';
export type ScenarioStatus = 'inactive' | 'active' | 'paused' | 'completed' | 'error';

export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    date: string;        // для Timeland
    time: string;        // для Timeland
    scenarioId: string;
    linkedDocumentId?: string;
    createdAt: string;
    updatedAt: string;
    assignee?: string;
}

export interface Scenario {
    id: string;
    title: string;
    description: string;
    status: ScenarioStatus;
    taskIds: string[];
    createdAt: string;
    updatedAt: string;
    color?: string;             // цвет сценария для Kanban
}

export interface WorkspaceData {
    documents: Document[];
    folders: Folder[];
    tasks?: Task[];
    scenarios?: Scenario[];
}
