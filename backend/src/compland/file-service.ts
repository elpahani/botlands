import { writeFileSync, readFileSync, existsSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { mkdirSync } from 'fs';

const COMPLAND_ROOT = process.env.COMPLAND_BASE_PATH || '/app/compland';

export function getFilePath(programId: string, filePath: string): string {
  const safePath = filePath.replace(/\.\./g, '').replace(/^\//, '');
  return join(COMPLAND_ROOT, programId, safePath);
}

export function readProgramFile(programId: string, filePath: string): string | null {
  const fullPath = getFilePath(programId, filePath);
  if (!existsSync(fullPath)) return null;
  try {
    return readFileSync(fullPath, 'utf-8');
  } catch { return null; }
}

export function writeProgramFile(programId: string, filePath: string, content: string): boolean {
  const fullPath = getFilePath(programId, filePath);
  try {
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content);
    return true;
  } catch { return false; }
}

export function deleteProgramFile(programId: string, filePath: string): boolean {
  const fullPath = getFilePath(programId, filePath);
  if (!existsSync(fullPath)) return false;
  try {
    rmSync(fullPath);
    return true;
  } catch { return false; }
}
