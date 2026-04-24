import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface ComplandTerminalProps {
  programId: string | null;
  initialLogs?: string;
}

export default function ComplandTerminal({ programId, initialLogs = '' }: ComplandTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const currentProgramIdRef = useRef<string | null>(null);

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

  // Write initial logs when no program running
  useEffect(() => {
    if (xtermRef.current && initialLogs && !programId) {
      xtermRef.current.clear();
      xtermRef.current.writeln(initialLogs);
    }
  }, [initialLogs, programId]);

  // WebSocket for live logs
  useEffect(() => {
    if (!programId || !xtermRef.current) return;

    // Don't reconnect if already connected to same program
    if (currentProgramIdRef.current === programId && wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Close old connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const ws = new WebSocket(`${protocol}//${host}/ws/compland`);

    ws.onopen = () => {
      console.log('[WS] Connected to Compland for', programId);
      ws.send(JSON.stringify({ type: 'subscribe', programId }));
      currentProgramIdRef.current = programId;
      
      if (xtermRef.current) {
        xtermRef.current.clear();
        xtermRef.current.writeln(`\x1b[38;2;0;255;136mℹ\x1b[0m Connected to ${programId.slice(0, 8)}...`);
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'log' && xtermRef.current) {
          xtermRef.current.write(data.text);
        } else if (data.type === 'completed' && xtermRef.current) {
          xtermRef.current.writeln(`\n\x1b[38;2;255;68;68mProcess completed with status: ${data.status}\x1b[0m`);
        }
      } catch (e) {
        console.error('[WS] Invalid message:', e);
      }
    };

    ws.onerror = (error) => {
      console.error('[WS] Error:', error);
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected from Compland');
      currentProgramIdRef.current = null;
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [programId]);

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
