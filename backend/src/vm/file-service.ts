import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';

export interface VMFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modifiedAt: string;
}

export class VMFileService {
  listFiles(workspacePath: string, subPath: string = ''): VMFile[] {
    const fullPath = join(workspacePath, subPath);
    if (!existsSync(fullPath)) return [];

    const entries = readdirSync(fullPath, { withFileTypes: true });
    return entries.map(entry => {
      const entryPath = join(subPath, entry.name);
      const stat = statSync(join(workspacePath, entryPath));
      return {
        name: entry.name,
        path: entryPath,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      };
    });
  }

  readFile(workspacePath: string, filePath: string): string {
    const fullPath = join(workspacePath, filePath);
    if (!existsSync(fullPath)) throw new Error('File not found');
    return readFileSync(fullPath, 'utf-8');
  }

  writeFile(workspacePath: string, filePath: string, content: string): void {
    const fullPath = join(workspacePath, filePath);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content, 'utf-8');
  }

  createFolder(workspacePath: string, folderPath: string): void {
    const fullPath = join(workspacePath, folderPath);
    mkdirSync(fullPath, { recursive: true });
  }
}

export const vmFileService = new VMFileService();
