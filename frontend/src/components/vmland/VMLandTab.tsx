import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Cpu, Play, Square, Terminal } from 'lucide-react';
import type { VMExecution } from '../../types/vm.js';

const API_BASE = '/api';

export const VMLandTab: React.FC = () => {
  const [executions, setExecutions] = useState<VMExecution[]>([]);
  const [script, setScript] = useState('print("Hello from VMLand!")');
  const [machineType, setMachineType] = useState<'python' | 'node' | 'rust'>('python');
  const [loading, setLoading] = useState(false);
  const logsRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    loadExecutions();
    const interval = setInterval(loadExecutions, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadExecutions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/vm/executions`);
      setExecutions(res.data);
    } catch {
      // ignore
    }
  };

  const handleRun = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/vm/execute`, {
        taskId: 'manual-' + Date.now(),
        scriptContent: script,
        machineType,
        timeoutMs: 30000,
      });
      loadExecutions();
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async (id: string) => {
    try {
      await axios.post(`${API_BASE}/vm/executions/${id}/stop`);
      loadExecutions();
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r border-border-medium bg-bg-secondary flex flex-col">
        <div className="p-4 border-b border-border-medium">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            VM Land
          </h2>
          <p className="text-sm text-text-secondary mt-1">Execute scripts in isolated environments</p>
        </div>

        <div className="p-4 space-y-3">
          <label className="block text-sm font-medium text-text-secondary">Machine Type</label>
          <select
            value={machineType}
            onChange={(e) => setMachineType(e.target.value as 'python' | 'node' | 'rust')}
            className="w-full h-10 px-3 rounded-lg bg-bg-primary border border-border-medium text-text-primary focus:outline-none focus:border-accent-primary text-sm"
          >
            <option value="python">Python + UV</option>
            <option value="node">Node.js</option>
            <option value="rust">Rust</option>
          </select>

          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={10}
            className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border-medium text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary text-sm font-mono resize-y min-h-[200px]"
            placeholder="Enter your script here..."
          />

          <button
            onClick={handleRun}
            disabled={loading}
            className="w-full h-10 rounded-lg bg-accent-primary text-white font-medium hover:bg-accent-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Play className="w-4 h-4" />
            {loading ? 'Running...' : 'Run Script'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        <h3 className="text-base font-bold text-text-primary mb-4">Executions</h3>

        <div className="space-y-3">
          {executions.length === 0 ? (
            <div className="text-center py-8 text-text-secondary text-sm">
              No active executions. Run a script to get started.
            </div>
          ) : (
            executions.map((exec) => (
              <div
                key={exec.id}
                className="rounded-lg border border-border-medium bg-bg-secondary overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border-medium">
                  <div className="flex items-center gap-3">
                    <Terminal className="w-4 h-4 text-text-secondary" />
                    <div>
                      <span className="text-sm font-medium text-text-primary">{exec.machineType}</span>
                      <span className="text-xs text-text-secondary ml-2">{exec.status}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {exec.status === 'running' && (
                      <button
                        onClick={() => handleStop(exec.id)}
                        className="p-1.5 rounded hover:bg-accent-danger/20 text-text-secondary hover:text-accent-danger transition-colors"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {exec.status === 'running' && (
                  <div className="px-4 py-2 bg-bg-primary">
                    <pre
                      ref={logsRef}
                      className="text-xs font-mono text-text-secondary whitespace-pre-wrap break-all max-h-40 overflow-auto"
                    >
                      Loading logs...
                    </pre>
                  </div>
                )}

                {(exec.status === 'completed' || exec.status === 'error') && (
                  <div className="px-4 py-2 bg-bg-primary">
                    <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap break-all max-h-60 overflow-auto">
                      {exec.output || 'No output'}
                    </pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
