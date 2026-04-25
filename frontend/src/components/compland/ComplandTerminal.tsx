import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io, Socket } from 'socket.io-client';
import '@xterm/xterm/css/xterm.css';

interface ComplandTerminalProps {
  programId: string | null;
  logs?: string;
}

// Module-level socket singleton
let globalSocket: Socket | null = null;
let socketRefCount = 0;

function acquireSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io({
      transports: ['websocket', 'polling'],
    });
    console.log('[Socket] Created global socket');
  }
  socketRefCount++;
  return globalSocket;
}

function releaseSocket() {
  socketRefCount--;
  if (socketRefCount <= 0 && globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
    console.log('[Socket] Disconnected global socket');
  }
}

export default function ComplandTerminal({ programId, logs = '' }: ComplandTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const currentProgramRef = useRef<string | null>(null);

  // Init terminal and socket ONCE per component instance
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const term = new Terminal({
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 13,
      theme: {
        background: '#0a0a0f',
        foreground: '#e0e0e0',
        cursor: '#00ff88',
        selectionBackground: '#00ff8833',
        black: '#0a0a0f',
        red: '#ff4444',
        green: '#00ff88',
        yellow: '#ffcc00',
        blue: '#4488ff',
        magenta: '#ff00ff',
        cyan: '#00ffff',
        white: '#e0e0e0',
        brightBlack: '#444444',
        brightRed: '#ff6666',
        brightGreen: '#66ffaa',
        brightYellow: '#ffdd44',
        brightBlue: '#66aaff',
        brightMagenta: '#ff66ff',
        brightCyan: '#66ffff',
        brightWhite: '#ffffff',
      },
      cursorBlink: true,
      scrollback: 10000,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;

    const socket = acquireSocket();
    socketRef.current = socket;

    const onConnect = () => {
      console.log('[Socket] Connected');
      if (currentProgramRef.current) {
        socket.emit('subscribe', currentProgramRef.current);
      }
    };

    const onLog = (text: string) => {
      if (xtermRef.current) {
        xtermRef.current.write(text);
      }
    };

    const onCompleted = (data: { status: string; exitCode: number }) => {
      if (xtermRef.current) {
        xtermRef.current.writeln(`\n\x1b[38;2;255;68;68mProcess completed with status: ${data.status}\x1b[0m`);
      }
    };

    socket.on('connect', onConnect);
    socket.on('log', onLog);
    socket.on('completed', onCompleted);

    // Already connected? Subscribe immediately
    if (socket.connected && currentProgramRef.current) {
      socket.emit('subscribe', currentProgramRef.current);
    }

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      socket.off('connect', onConnect);
      socket.off('log', onLog);
      socket.off('completed', onCompleted);
      if (currentProgramRef.current) {
        socket.emit('unsubscribe', currentProgramRef.current);
      }
      releaseSocket();
      term.dispose();
      xtermRef.current = null;
      socketRef.current = null;
    };
  }, []);

  // Handle programId changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !xtermRef.current) return;

    const oldProgram = currentProgramRef.current;

    if (oldProgram === programId) return;

    currentProgramRef.current = programId;

    if (oldProgram) {
      socket.emit('unsubscribe', oldProgram);
    }

    xtermRef.current.clear();
    if (programId) {
      xtermRef.current.writeln(`\x1b[38;2;0;255;136mℹ\x1b[0m Connected to ${programId.slice(0, 8)}...`);
      if (socket.connected) {
        socket.emit('subscribe', programId);
      }
    } else {
      xtermRef.current.writeln('\x1b[38;2;0;255;136mℹ\x1b[0m Select a process to view logs');
    }
  }, [programId]);

  // Display accumulated logs
  useEffect(() => {
    if (xtermRef.current && logs && programId) {
      xtermRef.current.clear();
      xtermRef.current.write(logs);
    }
  }, [logs, programId]);

  return (
    <div
      ref={terminalRef}
      style={{
        height: '100%',
        width: '100%',
        background: '#0a0a0f',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
}
