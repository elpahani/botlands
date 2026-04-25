import { Server as SocketIOServer } from 'socket.io';
import { complandEventEmitter } from './executor.js';

export function initializeComplandSocketIO(io: SocketIOServer) {
  // Use root namespace, not /compland
  io.on('connection', (socket) => {
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
    io.to(`program:${data.programId}`).emit('log', data.text);
  });

  complandEventEmitter.on('comp:completed', (data: any) => {
    io.to(`program:${data.programId}`).emit('completed', {
      status: data.status,
      exitCode: data.exitCode,
    });
    // Also broadcast to all clients for process list updates
    io.emit('processUpdate', {
      type: 'stopped',
      programId: data.programId,
      status: data.status,
    });
  });

  // Listen for process starts
  complandEventEmitter.on('comp:started', (data: { programId: string; programName: string }) => {
    io.emit('processUpdate', {
      type: 'started',
      programId: data.programId,
      programName: data.programName,
    });
  });
}
