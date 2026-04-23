import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';

export class WebSocketService {
    private io: Server | null = null;

    initialize(httpServer: HttpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    }

    broadcast(event: string, data?: any) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }

    broadcastUpdate() {
        if (this.io) {
            this.io.emit('workspace_updated');
        }
    }
}

export const wsService = new WebSocketService();
