import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import apiRoutes from './routes/api.routes.js';
import { wsService } from './services/websocket.service.js';
import { mcpService } from './services/mcp.service.js';
import { vmEventEmitter } from './vm/task-manager.js';

const app = express();
app.use(cors());

// MCP over SSE MUST be defined before express.json() because the MCP SDK consumes the raw req stream!
app.get('/mcp/sse', (req, res) => mcpService.handleSseConnection(req, res));
app.post('/mcp/messages', (req, res) => mcpService.handleMessage(req, res));

app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Serve VM log files
const VM_BASE_PATH = process.env.VM_BASE_PATH || '/app/vmland';
app.use('/api/vm-logs', express.static(VM_BASE_PATH));

// Setup Server
const server = createServer(app);
wsService.initialize(server);

// VM EventEmitter → WebSocket bridge
vmEventEmitter.on('vm:log', (data: { taskId: string; text: string }) => {
    wsService.broadcast('vm:log', {
        taskId: data.taskId,
        text: data.text,
    });
});

vmEventEmitter.on('vm:completed', (task: any) => {
    wsService.broadcast('vm:completed', task);
});

// Daily cleanup of old tasks
import { cleanupOldTasks } from './vm/task-manager.js';
setInterval(() => {
    cleanupOldTasks(24);
}, 24 * 60 * 60 * 1000);

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`[HTTP] Backend server running on http://localhost:${PORT}`);
    console.log(`[MCP] Server initialized and listening for SSE connections at http://localhost:${PORT}/mcp/sse`);
});
