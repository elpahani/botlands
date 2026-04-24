import { spawn, type ChildProcess } from 'child_process';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';
import type { ComplandProgram } from './project-manager.js';

const COMPLAND_ROOT = process.env.COMPLAND_BASE_PATH || '/app/compland';

export const complandEventEmitter = new EventEmitter();

const runningProcesses = new Map<string, ChildProcess>();

// Scan /proc on startup to find orphaned Compland processes
function scanOrphanedProcesses(): void {
  try {
    const { readdirSync, readFileSync } = require('fs');
    const dirs = readdirSync('/proc');
    for (const dir of dirs) {
      if (!/^\d+$/.test(dir)) continue;
      try {
        const cmdline = readFileSync(`/proc/${dir}/cmdline`, 'utf-8').replace(/\0/g, ' ').trim();
        // Look for python processes running from compland directories
        if (cmdline.includes(COMPLAND_ROOT) && cmdline.includes('python')) {
          // Extract program ID from the path
          const match = cmdline.match(/compland\/([a-f0-9-]+)/);
          if (match) {
            const programId = match[1];
            // Create a fake ChildProcess reference
            const fakeProc = { pid: parseInt(dir) } as ChildProcess;
            runningProcesses.set(programId, fakeProc);
            console.log(`[Compland] Restored orphaned process ${programId} (PID ${dir})`);
          }
        }
      } catch { /* process might have exited */ }
    }
  } catch (e) {
    console.error('[Compland] Failed to scan orphaned processes:', e);
  }
}

// Scan on startup
scanOrphanedProcesses();

export interface ExecutionResult {
  programId: string;
  status: 'running' | 'completed' | 'error';
  stdout: string;
  stderr: string;
  exitCode: number | null;
  startedAt: string;
  completedAt: string | null;
}

export async function runProgram(program: ComplandProgram): Promise<ExecutionResult> {
  const programPath = join(COMPLAND_ROOT, program.id);
  const venvPath = join(programPath, '.venv');
  const entryPath = join(programPath, program.entryPoint);
  const logPath = join(programPath, 'compland.log');

  const result: ExecutionResult = {
    programId: program.id,
    status: 'running',
    stdout: '',
    stderr: '',
    exitCode: null,
    startedAt: new Date().toISOString(),
    completedAt: null,
  };

  // Save initial log
  saveLog(result, logPath, program);

  // Check/create venv
  if (!existsSync(venvPath)) {
    await setupVenv(programPath, venvPath, result, logPath, program);
  }

  // Check/install dependencies
  const requirementsPath = join(programPath, 'requirements.txt');
  if (existsSync(requirementsPath)) {
    const depsContent = readFileSync(requirementsPath, 'utf-8').trim();
    if (depsContent) {
      await installDeps(programPath, venvPath, result, logPath, program);
    }
  }

  // Run the program in background
  runCode(program, programPath, venvPath, entryPath, result, logPath);

  return result;
}

function setupVenv(
  programPath: string,
  venvPath: string,
  result: ExecutionResult,
  logPath: string,
  program: ComplandProgram
): Promise<void> {
  return new Promise((resolve) => {
    const venv = spawn('python3', ['-m', 'venv', venvPath], { cwd: programPath });
    let errorOutput = '';

    venv.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    venv.on('close', (code) => {
      if (code !== 0) {
        result.status = 'error';
        result.stderr = `venv setup failed: ${errorOutput}`;
        result.exitCode = code ?? 1;
        result.completedAt = new Date().toISOString();
        saveLog(result, logPath, program);
        complandEventEmitter.emit(`comp:completed:${program.id}`, result);
        resolve();
        return;
      }
      resolve();
    });
  });
}

function installDeps(
  programPath: string,
  venvPath: string,
  result: ExecutionResult,
  logPath: string,
  program: ComplandProgram
): Promise<void> {
  return new Promise((resolve) => {
    const pip = spawn(`${venvPath}/bin/pip`, ['install', '-r', 'requirements.txt'], { cwd: programPath });
    let errorOutput = '';

    pip.stdout?.on('data', (data) => {
      const text = data.toString();
      result.stdout += text;
      complandEventEmitter.emit(`comp:log:${program.id}`, { programId: program.id, text });
    });

    pip.stderr?.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      complandEventEmitter.emit(`comp:log:${program.id}`, { programId: program.id, text: `[pip] ${text}` });
    });

    pip.on('close', (code) => {
      if (code !== 0) {
        result.status = 'error';
        result.stderr = `pip install failed: ${errorOutput}`;
        result.exitCode = code ?? 1;
        result.completedAt = new Date().toISOString();
        saveLog(result, logPath, program);
        complandEventEmitter.emit(`comp:completed:${program.id}`, result);
        resolve();
        return;
      }
      resolve();
    });
  });
}

function runCode(
  program: ComplandProgram,
  programPath: string,
  venvPath: string,
  entryPath: string,
  result: ExecutionResult,
  logPath: string
) {
  const pythonBin = join(venvPath, 'bin', 'python');
  const proc = spawn(pythonBin, [entryPath], { cwd: programPath });

  // Store reference for stopping
  runningProcesses.set(program.id, proc);

  proc.stdout?.on('data', (data) => {
    const text = data.toString();
    result.stdout += text;
    complandEventEmitter.emit(`comp:log:${program.id}`, { programId: program.id, text });
  });

  proc.stderr?.on('data', (data) => {
    const text = data.toString();
    result.stderr += text;
    complandEventEmitter.emit(`comp:log:${program.id}`, { programId: program.id, text: `[stderr] ${text}` });
  });

  proc.on('close', (code) => {
    result.status = code === 0 ? 'completed' : 'error';
    result.exitCode = code;
    result.completedAt = new Date().toISOString();
    runningProcesses.delete(program.id);
    saveLog(result, logPath, program);
    complandEventEmitter.emit(`comp:completed:${program.id}`, result);
  });

  proc.on('error', (err) => {
    result.status = 'error';
    result.stderr = `Process error: ${err.message}`;
    result.exitCode = -1;
    result.completedAt = new Date().toISOString();
    runningProcesses.delete(program.id);
    saveLog(result, logPath, program);
    complandEventEmitter.emit(`comp:completed:${program.id}`, result);
  });
}

export function stopProgram(programId: string): boolean {
  const proc = runningProcesses.get(programId);
  if (!proc) return false;
  proc.kill('SIGTERM');
  runningProcesses.delete(programId);
  return true;
}

export function isRunning(programId: string): boolean {
  return runningProcesses.has(programId);
}

export function getRunningProcesses(): { programId: string; pid: number | undefined }[] {
  return Array.from(runningProcesses.entries()).map(([programId, proc]) => ({
    programId,
    pid: proc.pid,
  }));
}

function saveLog(result: ExecutionResult, path: string, program: ComplandProgram) {
  const log = `=== Compland Execution Log ===
Program: ${program.name} (${program.id})
Started: ${result.startedAt}
Status: ${result.status}
Exit Code: ${result.exitCode ?? 'N/A'}
Completed: ${result.completedAt ?? 'N/A'}

--- stdout ---
${result.stdout}

--- stderr ---
${result.stderr}
`;
  writeFileSync(path, log);
}
