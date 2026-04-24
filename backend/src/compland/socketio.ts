import { Server as SocketIOServer } from 'socket.io';
import { complandEventEmitter } from './executor.js';

export function initializeComplandSocketIO(io: SocketIOServer) {
  const complandNamespace = io.of('/compland');

  complandNamespace.on('connection', (socket) => {
    console.log('[Socket.io] Client connected:', socket.id);

    socket.on('subscribe', (programId: string) => {
      socket.join(`program:${programId}`);
      console.log(`[Socket.io] ${socket.id} subscribed to ${programId}`);
    });

    socket.on('unsubscribe', (programId: string) => {
      socket.leave(`program:${programId}`);
      console.log(`[Socket.io] ${socket.id} unsubscribed from ${programId}`);
    });

    socket.on('disconnect', () => {
      console.log('[Socket.io] Client disconnected:', socket.id);
    });
  });

  // Broadcast logs to specific program room
  complandEventEmitter.on('comp:log', (data: { programId: string; text: string }) => {
    complandNamespace.to(`program:${data.programId}`).emit('log', data.text);
  });

  complandEventEmitter.on('comp:completed', (data: any) => {
    complandNamespace.to(`program:${data.programId}`).emit('completed', {
      status: data.status,
      exitCode: data.exitCode,
    });
  });
}
