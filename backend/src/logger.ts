import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');
const LOG_FILE = path.join(DATA_DIR, 'actions.log');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function logAction(actor: 'USER' | 'BOT', action: string, details: any = {}) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] [${actor}] ${action} - ${JSON.stringify(details)}\n`;
    fs.appendFileSync(LOG_FILE, entry);
    console.log(entry.trim());
}

export function getRecentLogs(linesCount: number = 50): string {
    if (!fs.existsSync(LOG_FILE)) return 'No logs found.';
    const content = fs.readFileSync(LOG_FILE, 'utf-8');
    const lines = content.trim().split('\n');
    return lines.slice(-linesCount).join('\n');
}
