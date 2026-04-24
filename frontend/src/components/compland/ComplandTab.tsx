import { useState, useEffect } from 'react';
import axios from 'axios';
import { Cpu, Play, Square, Terminal, FileText } from 'lucide-react';

interface CompTask {
  id: string;
  title: string;
  language: string;
  status: string;
  output: string;
  startedAt: string | null;
  completedAt: string | null;
}

const API_BASE = '/api';

export const ComplandTab: React.FC = () => {
  const [tasks, setTasks] = useState<CompTask[]>([]);
  const [script, setScript] = useState('print("Hello from CompLand!")');
  const [language, setLanguage] = useState<'python' | 'node' | 'rust'>('python');
  const [deps, setDeps] = useState('');
  const [title, setTitle] = useState('Test script');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadTasks = async () => {
    try {
      const res = await axios.get(`${API_BASE}/comp/tasks`);
      setTasks(res.data);
    } catch {
      // ignore
    }
  };

  const handleRun = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/comp/execute`, {
        title,
        scriptContent: script,
        language,
        dependencies: deps.split('\n').filter(d => d.trim()),
      });
      loadTasks();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async (id: string) => {
    try {
      await axios.post(`${API_BASE}/comp/tasks/${id}/stop`);
      loadTasks();
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Panel — Editor */}
      <div className="w-80 border-r border-border-medium bg-bg-secondary flex flex-col">
        <div className="p-3 border-b border-border-medium">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            Comp Land
          </h2>
        </div>

        <div className="p-3 space-y-3 flex-1 overflow-auto">
          <div>
            <label className="block text-xs text-text-secondary mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-8 px-2 rounded-lg bg-bg-primary border border-border-medium text-text-primary text-xs focus:outline-none focus:border-accent-primary"
            />
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'python' | 'node' | 'rust')}
              className="w-full h-8 px-2 rounded-lg bg-bg-primary border border-border-medium text-text-primary text-xs focus:outline-none focus:border-accent-primary"
            >
              <option value="python">Python</option>
              <option value="node">Node.js</option>
              <option value="rust">Rust</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1">Script</label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={10}
              className="w-full px-2 py-1.5 rounded-lg bg-bg-primary border border-border-medium text-text-primary text-xs font-mono resize-y min-h-[200px] focus:outline-none focus:border-accent-primary"
            />
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1">Dependencies (one per line)</label>
            <textarea
              value={deps}
              onChange={(e) => setDeps(e.target.value)}
              rows={3}
              className="w-full px-2 py-1.5 rounded-lg bg-bg-primary border border-border-medium text-text-primary text-xs font-mono resize-y min-h-[60px] focus:outline-none focus:border-accent-primary"
              placeholder="requests&#10;numpy>=1.20"
            />
          </div>

          <button
            onClick={handleRun}
            disabled={loading}
            className="w-full h-9 rounded-lg bg-accent-primary text-white hover:bg-accent-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-xs font-medium"
          >
            <Play className="w-3.5 h-3.5" />
            {loading ? 'Running...' : 'Run'}
          </button>
        </div>
      </div>

      {/* Right Panel — Tasks */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border-medium bg-bg-secondary">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-text-secondary" />
            <span className="text-sm font-medium text-text-primary">Tasks</span>
          </div>
          <span className="text-xs text-text-secondary">{tasks.length} total</span>
        </div>

        <div className="flex-1 overflow-auto p-3 space-y-2">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-text-secondary text-sm">
              No tasks yet. Create one and run!
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-lg border border-border-medium bg-bg-secondary overflow-hidden"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-border-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-text-secondary" />
                    <span className="text-xs font-medium text-text-primary">{task.title}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      task.status === 'running' ? 'bg-accent-primary/20 text-accent-primary' :
                      task.status === 'completed' ? 'bg-accent-success/20 text-accent-success' :
                      task.status === 'error' ? 'bg-accent-danger/20 text-accent-danger' :
                      'bg-bg-elevated text-text-secondary'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                  {task.status === 'running' && (
                    <button
                      onClick={() => handleStop(task.id)}
                      className="p-1 rounded hover:bg-accent-danger/20 text-text-secondary hover:text-accent-danger transition-colors"
                    >
                      <Square className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {task.output && (
                  <pre className="px-3 py-2 text-xs font-mono text-text-secondary whitespace-pre-wrap break-all max-h-32 overflow-auto">
                    {task.output}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
