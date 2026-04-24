import { spawn, type ChildProcess } from 'child_process';
import { writeFileSync, appendFileSync, mkdirSync, existsSync, readFileSync, rmSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

const COMPLAND_BASE_PATH = process.env.COMPLAND_BASE_PATH || '/app/compland';
const MAX_PARALLEL = parseInt(process.env.COMPLAND_MAX_PARALLEL || '4', 10);
const TIMEOUT_MS = parseInt(process.env.COMPLAND_TIMEOUT_MS || '60000', 10);
const MEMORY_MB = parseInt(process.env.COMPLAND_MEMORY_MB || '512', 10);

export const complandEventEmitter = new EventEmitter();

export interface CompTask {
  id: string;
  title: string;
  scriptContent: string;
  language: 'python' | 'node' | 'rust';
  dependencies: string[];
  status: 'waiting' | 'running' | 'completed' | 'error' | 'cancelled';
  output: string;
  exitCode: number | null;
  workspacePath: string;
  logFilePath: string;
  startedAt: string | null;
  completedAt: string | null;
  process?: ChildProcess;
}

const tasks = new Map<string, CompTask>();
let runningCount = 0;

function getWorkspacePath(taskId: string, language: string): string {
  return join(COMPLAND_BASE_PATH, `${language}-${taskId}`, 'workspace');
}

function getLogFilePath(taskId: string, language: string): string {
  return join(COMPLAND_BASE_PATH, `${language}-${taskId}`, 'logs.txt');
}

export function createCompTask(
  title: string,
  scriptContent: string,
  language: 'python' | 'node' | 'rust' = 'python',
  dependencies: string[] = []
): CompTask {
  const id = uuidv4();
  const workspacePath = getWorkspacePath(id, language);
  const logFilePath = getLogFilePath(id, language);

  mkdirSync(workspacePath, { recursive: true });

  const task: CompTask = {
    id,
    title,
    scriptContent,
    language,
    dependencies,
    status: 'waiting',
    output: '',
    exitCode: null,
    workspacePath,
    logFilePath,
    startedAt: null,
    completedAt: null,
  };

  tasks.set(id, task);
  return task;
}

export async function executeTask(taskId: string): Promise<void> {
  const task = tasks.get(taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);
  if (task.status !== 'waiting') throw new Error(`Task ${taskId} is not waiting`);

  if (runningCount >= MAX_PARALLEL) {
    throw new Error(`Max parallel executions reached (${MAX_PARALLEL})`);
  }

  // Write script
  const scriptFile = task.language === 'python' ? 'script.py' :
                     task.language === 'node' ? 'script.js' : 'script.rs';
  writeFileSync(join(task.workspacePath, scriptFile), task.scriptContent);

  // Write dependencies
  if (task.dependencies.length > 0) {
    if (task.language === 'python') {
      writeFileSync(join(task.workspacePath, 'requirements.txt'), task.dependencies.join('\n'));
    } else if (task.language === 'node') {
      const pkg = { name: 'compland-task', version: '1.0.0', dependencies: {} as Record<string, string> };
      task.dependencies.forEach(dep => {
        const parts = dep.split('@');
        const name = parts[0]!;
        const version = parts[1] || '*';
        if (name) pkg.dependencies[name] = version;
      });
      writeFileSync(join(task.workspacePath, 'package.json'), JSON.stringify(pkg, null, 2));
    }
  }

  // Get interpreter
  let command: string;
  let args: string[];

  if (task.language === 'python') {
    command = 'python3';
    args = [scriptFile];
  } else if (task.language === 'node') {
    command = 'node';
    args = [scriptFile];
  } else {
    command = 'rustc';
    args = ['--edition', '2021', '-o', 'output', scriptFile, '&&', './output'];
  }

  // Spawn process
  const child = spawn(command, args, {
    cwd: task.workspacePath,
    env: {
      ...process.env,
      HOME: '/tmp',
      PYTHONDONTWRITEBYTECODE: '1',
    },
  });

  task.process = child;
  runningCount++;
  task.status = 'running';
  task.startedAt = new Date().toISOString();

  const logBuffer: string[] = [];

  // Buffer logs
  const logInterval = setInterval(() => {
    if (logBuffer.length > 0) {
      const text = logBuffer.join('');
      logBuffer.length = 0;
      appendFileSync(task.logFilePath, text);
      complandEventEmitter.emit(`comp:log:${task.id}`, text);
    }
  }, 100);

  child.stdout?.on('data', (chunk: Buffer) => {
    logBuffer.push(chunk.toString());
  });

  child.stderr?.on('data', (chunk: Buffer) => {
    logBuffer.push(chunk.toString());
  });

  // Timeout
  const timeout = setTimeout(() => {
    if (!child.killed) {
      child.kill('SIGKILL');
      task.status = 'error';
      task.output = 'Execution timed out';
      task.completedAt = new Date().toISOString();
      complandEventEmitter.emit(`comp:completed:${task.id}`, task);
    }
  }, TIMEOUT_MS);

  child.on('exit', (code) => {
    runningCount--;
    clearInterval(logInterval);
    clearTimeout(timeout);

    if (logBuffer.length > 0) {
      const text = logBuffer.join('');
      appendFileSync(task.logFilePath, text);
      complandEventEmitter.emit(`comp:log:${task.id}`, text);
    }

    task.exitCode = code ?? -1;
    task.status = code === 0 ? 'completed' : 'error';
    task.completedAt = new Date().toISOString();

    // Read logs
    if (existsSync(task.logFilePath)) {
      try {
        task.output = readFileSync(task.logFilePath, 'utf-8');
      } catch {
        // ignore
      }
    }

    complandEventEmitter.emit(`comp:completed:${task.id}`, task);
  });

  child.on('error', (err) => {
    runningCount--;
    clearInterval(logInterval);
    clearTimeout(timeout);
    task.status = 'error';
    task.output = err.message;
    task.completedAt = new Date().toISOString();
    complandEventEmitter.emit(`comp:completed:${task.id}`, task);
  });
}

export function stopTask(taskId: string): void {
  const task = tasks.get(taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);
  if (!task.process) throw new Error(`Task ${taskId} has no process`);

  task.process.kill('SIGKILL');
  task.status = 'cancelled';
  task.completedAt = new Date().toISOString();
  runningCount--;
}

export function getTask(taskId: string): CompTask | undefined {
  return tasks.get(taskId);
}

export function listTasks(): CompTask[] {
  return Array.from(tasks.values());
}

export function getTaskLogs(taskId: string): string {
  const task = tasks.get(taskId);
  if (task && existsSync(task.logFilePath)) {
    return readFileSync(task.logFilePath, 'utf-8');
  }
  return '';
}

export function cleanupOldTasks(maxAgeHours: number = 24): void {
  try {
    const dirs = readdirSync(COMPLAND_BASE_PATH);
    const now = Date.now();
    for (const dir of dirs) {
      const dirPath = join(COMPLAND_BASE_PATH, dir);
      const stat = statSync(dirPath);
      const ageHours = (now - stat.mtimeMs) / (1000 * 60 * 60);
      if (ageHours > maxAgeHours) {
        rmSync(dirPath, { recursive: true, force: true });
      }
    }
  } catch {
    // ignore
  }
}
