import { BasePackageManager } from './base.js';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

export class PythonPackageManager extends BasePackageManager {
  readonly name = 'python-pip';
  readonly language = 'python';

  detect(workspacePath: string): boolean {
    return existsSync(join(workspacePath, 'requirements.txt')) ||
           existsSync(join(workspacePath, 'pyproject.toml')) ||
           existsSync(join(workspacePath, 'setup.py'));
  }

  async install(workspacePath: string): Promise<string> {
    const venvPath = join(workspacePath, '.venv');
    const logs: string[] = [];

    // 1. Create venv if not exists
    if (!existsSync(venvPath)) {
      this.log('Creating virtual environment...');
      await this.runCommand('python3', ['-m', 'venv', venvPath], workspacePath, logs);
    }

    const pipPath = join(venvPath, 'bin', 'pip');

    // 2. Upgrade pip
    this.log('Upgrading pip...');
    await this.runCommand(pipPath, ['install', '--upgrade', 'pip'], workspacePath, logs);

    // 3. Install requirements.txt
    const reqFile = join(workspacePath, 'requirements.txt');
    if (existsSync(reqFile)) {
      this.log('Installing requirements.txt...');
      await this.runCommand(pipPath, ['install', '-r', reqFile], workspacePath, logs);
    }

    // 4. Install pyproject.toml dependencies
    const pyprojectFile = join(workspacePath, 'pyproject.toml');
    if (existsSync(pyprojectFile)) {
      this.log('Installing pyproject.toml dependencies...');
      await this.runCommand(pipPath, ['install', '-e', workspacePath], workspacePath, logs);
    }

    return logs.join('\n');
  }

  getRunCommand(workspacePath: string, scriptFile: string): { binary: string; args: string[] } {
    const venvPath = join(workspacePath, '.venv');
    const pythonPath = join(venvPath, 'bin', 'python3');

    // If venv doesn't exist, fallback to system python3
    if (!existsSync(pythonPath)) {
      return { binary: '/usr/bin/python3', args: [scriptFile] };
    }

    return { binary: pythonPath, args: [scriptFile] };
  }

  private runCommand(command: string, args: string[], cwd: string, logs: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { cwd, env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } });

      child.stdout?.on('data', (chunk) => logs.push(chunk.toString()));
      child.stderr?.on('data', (chunk) => logs.push(chunk.toString()));

      child.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Command failed with code ${code}: ${logs.slice(-5).join('\n')}`));
      });

      child.on('error', (err) => reject(err));
    });
  }
}
