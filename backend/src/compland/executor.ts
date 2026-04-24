import { spawn } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';
import type { ComplandProgram } from './project-manager.js';

const COMPLAND_ROOT = process.env.COMPLAND_BASE_PATH || '/app/compland';

export const complandEventEmitter = new EventEmitter();

export interface ExecutionResult {
  programId: string;
  status: 'running' | 'completed' | 'error';
  stdout: string;
  stderr: string;
  exitCode: number | null;
  startedAt: string;
  completedAt: string | null;
}

export function runProgram(program: ComplandProgram): ExecutionResult {
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

  let setupCompleted = false;
  let setupOutput = '';

  const setupVenv = () => {
    const uv = spawn('uv', ['venv', venvPath], { cwd: programPath });
    let output = '';
    let errorOutput = '';

    uv.stdout?.on('data', (data) => {
      output += data.toString();
    });
    uv.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    uv.on('close', (code) => {
      if (code !== 0) {
        result.status = 'error';
        result.stderr = `venv setup failed: ${errorOutput}`;
        result.exitCode = code ?? 1;
        saveLog(result, logPath);
        complandEventEmitter.emit(`comp:completed:${program.id}`, result);
        return;
      }
      setupCompleted = true;
      installDependencies();
    });
  };

  const installDependencies = () => {
    const requirementsPath = join(programPath, 'requirements.txt');
    if (!existsSync(requirementsPath)) {
      runCode();
      return;
    }

    const depsContent = readFileSync(requirementsPath, 'utf-8').trim();
    if (!depsContent) {
      runCode();
      return;
    }

    const pip = spawn('uv', ['pip', 'install', '-r', 'requirements.txt'], { cwd: programPath });
    let output = '';
    let errorOutput = '';

    pip.stdout?.on('data', (data) => {
      output += data.toString();
    });
    pip.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    pip.on('close', (code) => {
      if (code !== 0) {
        result.status = 'error';
        result.stderr = `dependencies install failed: ${errorOutput}`;
        result.exitCode = code ?? 1;
        saveLog(result, logPath);
        complandEventEmitter.emit(`comp:completed:${program.id}`, result);
        return;
      }
      runCode();
    });
  };

  const runCode = () => {
    const pythonBin = join(venvPath, 'bin', 'python');
    const proc = spawn(pythonBin, [entryPath], { cwd: programPath });

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
      saveLog(result, logPath);
      complandEventEmitter.emit(`comp:completed:${program.id}`, result);
    });
  };

  const saveLog = (res: ExecutionResult, path: string) => {
    const log = `=== Compland Execution Log ===
Program: ${program.name} (${program.id})
Started: ${res.startedAt}
Status: ${res.status}
Exit Code: ${res.exitCode ?? 'N/A'}
Completed: ${res.completedAt ?? 'N/A'}

--- stdout ---
${res.stdout}

--- stderr ---
${res.stderr}
`;
    writeFileSync(path, log);
  };

  // Start execution
  if (!existsSync(venvPath)) {
    setupVenv();
  } else {
    runCode();
  }

  return result;
}

function readFileSync(path: string, encoding: BufferEncoding): string {
  return require('fs').readFileSync(path, encoding);
}
