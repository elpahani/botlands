import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import apiRoutes from './routes/api.routes.js';
import { wsService } from './services/websocket.service.js';
import { mcpService } from './services/mcp.service.js';

const app = express();
app.use(cors());

// MCP over SSE MUST be defined before express.json() because the MCP SDK consumes the raw req stream!
app.get('/mcp/sse', (req, res) => mcpService.handleSseConnection(req, res));
app.post('/mcp/messages', (req, res) => mcpService.handleMessage(req, res));

app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Setup Server
const server = createServer(app);
wsService.initialize(server);

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`[HTTP] Backend server running on http://localhost:${PORT}`);
    console.log(`[MCP] Server initialized and listening for SSE connections at http://localhost:${PORT}/mcp/sse`);
});
