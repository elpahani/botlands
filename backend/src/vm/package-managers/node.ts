import { BasePackageManager } from './base.js';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

export class NodePackageManager extends BasePackageManager {
  readonly name = 'node-npm';
  readonly language = 'node';

  detect(workspacePath: string): boolean {
    return existsSync(join(workspacePath, 'package.json'));
  }

  async install(workspacePath: string): Promise<string> {
    const logs: string[] = [];

    const packageFile = join(workspacePath, 'package.json');
    if (existsSync(packageFile)) {
      this.log('Installing package.json dependencies...');
      await this.runCommand('npm', ['install'], workspacePath, logs);
    }

    return logs.join('\n');
  }

  getRunCommand(workspacePath: string, scriptFile: string): { binary: string; args: string[] } {
    return { binary: '/usr/bin/node', args: [scriptFile] };
  }

  private runCommand(command: string, args: string[], cwd: string, logs: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { cwd, env: process.env });

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
