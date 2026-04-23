import type { Task } from '../models/types.js';

export interface VMExecution {
  id: string;
  taskId: string;
  machineType: 'python' | 'node' | 'rust';
  status: 'waiting' | 'running' | 'completed' | 'error' | 'cancelled';
  scriptContent: string;
  output: string;
  exitCode: number | null;
  startedAt: string | null;
  completedAt: string | null;
  workspacePath: string;
  logFilePath: string;
}

export interface VMTemplate {
  id: string;
  name: string;
  type: 'python' | 'node' | 'rust';
  description: string;
  entrypoint: string;
  setupCommands: string[];
}

export interface VMMachine {
  id: string;
  templateId: string;
  name: string;
  type: 'python' | 'node' | 'rust';
  workspacePath: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface VMSpawnOptions {
  task: Task;
  scriptContent: string;
  machineType: 'python' | 'node' | 'rust';
  timeoutMs?: number;
  memoryLimit?: number; // MB
  networkEnabled?: boolean;
  dependencies?: string[]; // e.g. ["requests", "numpy>=1.20"]
}

export const VM_TEMPLATES: VMTemplate[] = [
  {
    id: 'python-default',
    name: 'Python + UV',
    type: 'python',
    description: 'Python 3.12 with UV package manager',
    entrypoint: 'python',
    setupCommands: ['uv venv', 'uv pip install -r requirements.txt'],
  },
  {
    id: 'node-default',
    name: 'Node.js',
    type: 'node',
    description: 'Node.js 20 with npm',
    entrypoint: 'node',
    setupCommands: ['npm install'],
  },
  {
    id: 'rust-default',
    name: 'Rust',
    type: 'rust',
    description: 'Rust with rust-script',
    entrypoint: 'rust-script',
    setupCommands: [],
  },
];
