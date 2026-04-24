import { WebSocketServer, WebSocket } from 'ws';
import { complandEventEmitter } from './executor.js';

const complandClients = new Map<string, WebSocket[]>();

export function initializeComplandWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket) => {
    console.log('[Compland WS] Client connected');

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'subscribe' && data.programId) {
          // Subscribe to program logs
          if (!complandClients.has(data.programId)) {
            complandClients.set(data.programId, []);
          }
          complandClients.get(data.programId)?.push(ws);
          console.log(`[Compland WS] Subscribed to ${data.programId}`);
        }
      } catch (e) {
        console.error('[Compland WS] Invalid message:', e);
      }
    });

    ws.on('close', () => {
      // Remove from all subscriptions
      for (const [programId, clients] of complandClients.entries()) {
        const index = clients.indexOf(ws);
        if (index !== -1) {
          clients.splice(index, 1);
          if (clients.length === 0) {
            complandClients.delete(programId);
          }
        }
      }
      console.log('[Compland WS] Client disconnected');
    });
  });

  // Listen for Compland events and broadcast
  complandEventEmitter.on('comp:log', (data: { programId: string; text: string }) => {
    const clients = complandClients.get(data.programId);
    if (clients) {
      const message = JSON.stringify({ type: 'log', text: data.text });
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  });

  complandEventEmitter.on('comp:completed', (data: any) => {
    const clients = complandClients.get(data.programId);
    if (clients) {
      const message = JSON.stringify({ type: 'completed', status: data.status, exitCode: data.exitCode });
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  });
}
