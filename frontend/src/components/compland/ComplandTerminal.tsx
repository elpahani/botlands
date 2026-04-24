import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io, Socket } from 'socket.io-client';
import '@xterm/xterm/css/xterm.css';

interface ComplandTerminalProps {
  programId: string | null;
  initialLogs?: string;
  logs?: string;
  onLog?: (text: string) => void;
}

export default function ComplandTerminal({ programId, initialLogs = '', logs = '', onLog }: ComplandTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const lastLogsRef = useRef<string>('');

  // Init terminal once
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
    fitAddonRef.current = fitAddon;

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      term.dispose();
      xtermRef.current = null;
    };
  }, []);

  // Display logs when switching between processes
  useEffect(() => {
    if (xtermRef.current && logs !== lastLogsRef.current) {
      lastLogsRef.current = logs;
      xtermRef.current.clear();
      if (logs) {
        xtermRef.current.write(logs);
      } else if (initialLogs) {
        xtermRef.current.writeln(initialLogs);
      } else if (programId) {
        xtermRef.current.writeln(`\x1b[38;2;0;255;136mℹ\x1b[0m Connected to ${programId.slice(0, 8)}...`);
      } else {
        xtermRef.current.writeln('\x1b[38;2;0;255;136mℹ\x1b[0m Select a process to view logs');
      }
    }
  }, [logs, initialLogs, programId]);

  // Socket.io connection for live logs
  useEffect(() => {
    if (!programId || !xtermRef.current) return;

    // Don't reconnect if already connected to same program
    if (socketRef.current?.connected) {
      return;
    }

    // Close old connection
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io('/compland', {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[Socket.io] Connected to', programId);
      socket.emit('subscribe', programId);
    });

    socket.on('log', (text: string) => {
      if (xtermRef.current) {
        xtermRef.current.write(text);
      }
      if (onLog) {
        onLog(text);
      }
    });

    socket.on('completed', (data: { status: string; exitCode: number }) => {
      if (xtermRef.current) {
        xtermRef.current.writeln(`\n\x1b[38;2;255;68;68mProcess completed with status: ${data.status}\x1b[0m`);
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket.io] Disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket.io] Connection error:', err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.emit('unsubscribe', programId);
      socket.disconnect();
    };
  }, [programId, onLog]);

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
