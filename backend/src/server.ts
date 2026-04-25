import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import apiRoutes from './routes/api.routes.js';
import { wsService } from './services/websocket.service.js';
import { mcpService } from './services/mcp.service.js';
import { initializeComplandSocketIO } from './compland/socketio.js';
import { complandEventEmitter } from './compland/executor.js';

const app = express();
app.use(cors());

// MCP over SSE MUST be defined before express.json() because the MCP SDK consumes the raw req stream!
app.get('/mcp/sse', (req, res) => mcpService.handleSseConnection(req, res));
app.post('/mcp/messages', (req, res) => mcpService.handleMessage(req, res));

app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Serve VM log files
const COMPLAND_BASE_PATH = process.env.COMPLAND_BASE_PATH || '/app/compland';
app.use('/api/comp-logs', express.static(COMPLAND_BASE_PATH));

// Setup Server
const server = createServer(app);
wsService.initialize(server);

// Compland Socket.io namespace on shared server
initializeComplandSocketIO(wsService.io!);

// Daily cleanup of old tasks
import { cleanupOldTasks } from './compland/task-manager.js';
setInterval(() => {
    cleanupOldTasks(24);
}, 24 * 60 * 60 * 1000);

// Task scheduler — auto-activate tasks by startTime
import { storageService } from './services/storage.service.js';
const activatedTasks = new Set<string>(); // Track already activated tasks

setInterval(() => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const tasks = storageService.listTasks();
    
    console.log(`[Scheduler] Checking at ${currentTime}, tasks: ${tasks.length}, waiting: ${tasks.filter(t => t.status === 'waiting').length}`);
    
    for (const task of tasks) {
        // Check if task should be activated (time matches, still waiting, and not yet activated)
        if (task.status === 'waiting' && task.time === currentTime && !activatedTasks.has(task.id)) {
            console.log(`[Scheduler] ✓ Activating task ${task.id} (${task.title}) at ${currentTime}`);
            activatedTasks.add(task.id); // Mark as activated
            const updated = storageService.updateTask(task.id, { status: 'active' });
            if (updated) {
                wsService.broadcastTaskEvent('task:updated', updated);
                // Auto-run Compland program
                if (task.programId) {
                    console.log(`[Scheduler] ▶ Auto-running program ${task.programId}`);
                    import('./compland/executor.js').then(({ runProgram }) => {
                        import('./compland/project-manager.js').then(({ getProgram }) => {
                            const program = getProgram(task.programId!);
                            if (program) {
                                runProgram(program).catch(err => {
                                    console.error('[Scheduler] Auto-run failed:', err);
                                });
                            } else {
                                console.error(`[Scheduler] Program ${task.programId} not found`);
                            }
                        });
                    });
                }
            }
        }
    }
    
    // Cleanup old activated tasks (after 1 hour)
    if (activatedTasks.size > 1000) {
        activatedTasks.clear();
    }
}, 30 * 1000); // Every 30 seconds

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`[HTTP] Backend server running on http://localhost:${PORT}`);
    console.log(`[MCP] Server initialized and listening for SSE connections at http://localhost:${PORT}/mcp/sse`);
});
