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
