import { writeFileSync, readFileSync, mkdirSync, rmSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';

const COMPLAND_ROOT = process.env.COMPLAND_BASE_PATH || '/app/compland';

export interface ComplandProgram {
  id: string;
  name: string;
  language: 'python';
  entryPoint: string;
  createdAt: string;
  updatedAt: string;
  files: string[];
}

function getProgramPath(id: string): string {
  return join(COMPLAND_ROOT, id);
}

function getMetaPath(id: string): string {
  return join(getProgramPath(id), '.compland.json');
}

export function listPrograms(): ComplandProgram[] {
  if (!existsSync(COMPLAND_ROOT)) return [];
  const dirs = readdirSync(COMPLAND_ROOT);
  return dirs.map(dir => {
    const metaPath = getMetaPath(dir);
    if (!existsSync(metaPath)) return null;
    try {
      const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
      const files = listFiles(dir);
      return { ...meta, files } as ComplandProgram;
    } catch { return null; }
  }).filter(Boolean) as ComplandProgram[];
}

export function getProgram(id: string): ComplandProgram | null {
  const metaPath = getMetaPath(id);
  if (!existsSync(metaPath)) return null;
  try {
    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
    const files = listFiles(id);
    return { ...meta, files } as ComplandProgram;
  } catch { return null; }
}

export function createProgram(name: string): ComplandProgram {
  const id = uuidv4();
  const path = getProgramPath(id);
  mkdirSync(path, { recursive: true });

  const program: ComplandProgram = {
    id,
    name,
    language: 'python',
    entryPoint: 'main.py',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files: ['main.py', 'requirements.txt', '.compland.json'],
  };

  writeFileSync(join(path, 'main.py'), 'print("Hello from Compland!")\n');
  writeFileSync(join(path, 'requirements.txt'), '');
  writeFileSync(join(path, '.compland.json'), JSON.stringify(program, null, 2));

  return program;
}

export function deleteProgram(id: string): boolean {
  const path = getProgramPath(id);
  if (!existsSync(path)) return false;
  rmSync(path, { recursive: true, force: true });
  return true;
}

export function renameProgram(id: string, newName: string): ComplandProgram | null {
  const metaPath = getMetaPath(id);
  if (!existsSync(metaPath)) return null;
  try {
    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
    meta.name = newName;
    meta.updatedAt = new Date().toISOString();
    writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    const files = listFiles(id);
    return { ...meta, files } as ComplandProgram;
  } catch { return null; }
}

function listFiles(programId: string): string[] {
  const path = getProgramPath(programId);
  if (!existsSync(path)) return [];
  const walk = (dir: string, prefix: string): string[] => {
    const entries = readdirSync(dir);
    let files: string[] = [];
    for (const entry of entries) {
      if (entry.startsWith('.')) continue;
      const fullPath = join(dir, entry);
      const relPath = prefix ? `${prefix}/${entry}` : entry;
      if (statSync(fullPath).isDirectory()) {
        files = files.concat(walk(fullPath, relPath));
      } else {
        files.push(relPath);
      }
    }
    return files;
  };
  return walk(path, '');
}
