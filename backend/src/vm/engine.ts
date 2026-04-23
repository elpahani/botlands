import { spawn, type ChildProcess } from 'child_process';
import { writeFileSync, appendFileSync, mkdirSync, existsSync, readFileSync, rmSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';
import type { VMExecution, VMSpawnOptions } from './types.js';
import { v4 as uuidv4 } from 'uuid';

const VM_BASE_PATH = process.env.VM_BASE_PATH || '/app/vmland';
const MAX_PARALLEL_EXECUTIONS = 4;
const DEFAULT_TIMEOUT_MS = 60000;
const DEFAULT_MEMORY_MB = 512;

export const vmEventEmitter = new EventEmitter();

const activeExecutions = new Map<string, {
  process: ChildProcess;
  execution: VMExecution;
  logBuffer: string[];
  logInterval: NodeJS.Timeout;
}>();

let runningCount = 0;

export function getRunningExecutions(): VMExecution[] {
  return Array.from(activeExecutions.values()).map(e => e.execution);
}

export async function spawnVM(options: VMSpawnOptions): Promise<VMExecution> {
  const { task, scriptContent, machineType, timeoutMs = DEFAULT_TIMEOUT_MS, memoryLimit = DEFAULT_MEMORY_MB, networkEnabled = true } = options;

  if (runningCount >= MAX_PARALLEL_EXECUTIONS) {
    throw new Error(`Max parallel executions reached (${MAX_PARALLEL_EXECUTIONS})`);
  }

  const executionId = uuidv4();
  const taskId = task.id;
  const workspacePath = join(VM_BASE_PATH, `${machineType}-${executionId}`, 'workspace');
  const logFilePath = join(VM_BASE_PATH, `${machineType}-${executionId}`, 'logs.txt');

  mkdirSync(workspacePath, { recursive: true });

  const scriptFile = machineType === 'python' ? 'script.py' :
                     machineType === 'node' ? 'script.js' : 'script.rs';
  writeFileSync(join(workspacePath, scriptFile), scriptContent);

  const execution: VMExecution = {
    id: executionId,
    taskId,
    machineType,
    status: 'waiting',
    scriptContent,
    output: '',
    exitCode: null,
    startedAt: null,
    completedAt: null,
    workspacePath,
    logFilePath,
  };

  const bwrapArgs = [
    '--ro-bind', '/usr', '/usr',
    '--ro-bind', '/bin', '/bin',
    '--ro-bind', '/lib', '/lib',
    '--ro-bind', '/lib64', '/lib64',
    '--bind', workspacePath, '/workspace',
    '--chdir', '/workspace',
    '--die-with-parent',
  ];

  if (!networkEnabled) {
    bwrapArgs.push('--unshare-net');
  }

  const prlimitArgs = [`--as=${memoryLimit * 1024 * 1024}`];

  let command: string;
  let args: string[];

  if (machineType === 'python') {
    command = 'python3';
    args = [scriptFile];
  } else if (machineType === 'node') {
    command = 'node';
    args = [scriptFile];
  } else if (machineType === 'rust') {
    command = 'rust-script';
    args = [scriptFile];
  } else {
    throw new Error(`Unknown machine type: ${machineType}`);
  }

  const fullArgs = [...bwrapArgs, '--', 'prlimit', ...prlimitArgs, command, ...args];

  const child = spawn('bwrap', fullArgs, {
    env: {
      ...process.env,
      HOME: '/tmp',
      PYTHONDONTWRITEBYTECODE: '1',
    },
    detached: false,
  });

  runningCount++;
  execution.status = 'running';
  execution.startedAt = new Date().toISOString();

  const logBuffer: string[] = [];

  const logInterval = setInterval(() => {
    if (logBuffer.length > 0) {
      const text = logBuffer.join('');
      logBuffer.length = 0;
      appendFileSync(logFilePath, text);
      vmEventEmitter.emit(`vm:log:${executionId}`, text);
    }
  }, 100);

  child.stdout?.on('data', (chunk: Buffer) => {
    logBuffer.push(chunk.toString());
  });

  child.stderr?.on('data', (chunk: Buffer) => {
    logBuffer.push(chunk.toString());
  });

  const timeout = setTimeout(() => {
    if (!child.killed) {
      child.kill('SIGKILL');
      execution.status = 'error';
      execution.output = 'Execution timed out';
      execution.completedAt = new Date().toISOString();
      vmEventEmitter.emit(`vm:completed:${executionId}`, execution);
    }
  }, timeoutMs);

  child.on('exit', (code) => {
    runningCount--;
    clearInterval(logInterval);
    clearTimeout(timeout);

    if (logBuffer.length > 0) {
      const text = logBuffer.join('');
      appendFileSync(logFilePath, text);
      vmEventEmitter.emit(`vm:log:${executionId}`, text);
    }

    execution.exitCode = code ?? -1;
    execution.status = code === 0 ? 'completed' : 'error';
    execution.completedAt = new Date().toISOString();

    const outputPath = join(workspacePath, 'output.json');
    if (existsSync(outputPath)) {
      try {
        execution.output = readFileSync(outputPath, 'utf-8');
      } catch {
        execution.output = '';
      }
    }

    if (existsSync(logFilePath)) {
      try {
        execution.output = readFileSync(logFilePath, 'utf-8');
      } catch {
        // ignore
      }
    }

    vmEventEmitter.emit(`vm:completed:${executionId}`, execution);
    activeExecutions.delete(executionId);
  });

  child.on('error', (err) => {
    runningCount--;
    clearInterval(logInterval);
    clearTimeout(timeout);
    execution.status = 'error';
    execution.output = err.message;
    execution.completedAt = new Date().toISOString();
    vmEventEmitter.emit(`vm:completed:${executionId}`, execution);
    activeExecutions.delete(executionId);
  });

  activeExecutions.set(executionId, { process: child, execution, logBuffer, logInterval });

  return execution;
}

export async function stopVM(executionId: string): Promise<void> {
  const active = activeExecutions.get(executionId);
  if (!active) {
    throw new Error(`Execution ${executionId} not found`);
  }

  active.process.kill('SIGKILL');
  clearInterval(active.logInterval);
  active.execution.status = 'cancelled';
  active.execution.completedAt = new Date().toISOString();
  vmEventEmitter.emit(`vm:completed:${executionId}`, active.execution);
  activeExecutions.delete(executionId);
  runningCount--;
}

export function getExecutionLogs(executionId: string): string {
  const active = activeExecutions.get(executionId);
  if (active) {
    const buffered = active.logBuffer.join('');
    if (existsSync(active.execution.logFilePath)) {
      return readFileSync(active.execution.logFilePath, 'utf-8') + buffered;
    }
    return buffered;
  }

  const vmBase = VM_BASE_PATH || '/app/vmland';
  const dirs = readdirSync(vmBase).filter(d => d.includes(executionId));
  if (dirs.length > 0) {
    const dir = dirs[0]!;
    const logFile = join(vmBase, dir, 'logs.txt');
    if (existsSync(logFile)) {
      return readFileSync(logFile, 'utf-8');
    }
  }
  return '';
}

export function cleanupOldExecutions(maxAgeHours: number = 24): void {
  try {
    const dirs = readdirSync(VM_BASE_PATH);
    const now = Date.now();
    for (const dir of dirs) {
      const dirPath = join(VM_BASE_PATH, dir);
      const stat = statSync(dirPath);
      const ageHours = (now - stat.mtimeMs) / (1000 * 60 * 60);
      if (ageHours > maxAgeHours) {
        rmSync(dirPath, { recursive: true, force: true });
      }
    }
  } catch {
    // ignore cleanup errors
  }
}
