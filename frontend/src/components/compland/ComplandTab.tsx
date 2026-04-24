import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Play, Plus, Folder, FileCode, Terminal, Cpu } from 'lucide-react';

const API_BASE = '/api';

interface ComplandProgram {
  id: string;
  name: string;
  language: string;
  entryPoint: string;
  files: string[];
}

interface ExecutionResult {
  programId: string;
  status: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export const ComplandTab: React.FC = () => {
  const [programs, setPrograms] = useState<ComplandProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [showNewProgram, setShowNewProgram] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');

  const loadPrograms = useCallback(async () => {
    const res = await axios.get(`${API_BASE}/comp/programs`);
    setPrograms(res.data);
  }, []);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  const loadFile = async (programId: string, filePath: string) => {
    const res = await axios.get(`${API_BASE}/comp/programs/${programId}/files/${filePath}`);
    setFileContent(res.data.content);
    setSelectedFile(filePath);
  };

  const saveFile = async () => {
    if (!selectedProgram || !selectedFile) return;
    await axios.put(`${API_BASE}/comp/programs/${selectedProgram}/files/${selectedFile}`, {
      content: fileContent,
    });
  };

  const runProgram = async () => {
    if (!selectedProgram) return;
    setIsRunning(true);
    setOutput('Running...');
    try {
      const res = await axios.post(`${API_BASE}/comp/programs/${selectedProgram}/run`);
      const result: ExecutionResult = res.data;
      setOutput(`${result.stdout}\n${result.stderr ? '--- stderr ---\n' + result.stderr : ''}\nExit code: ${result.exitCode}`);
    } catch (e: any) {
      setOutput(`Error: ${e.response?.data?.error || e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const createProgram = async () => {
    if (!newProgramName.trim()) return;
    await axios.post(`${API_BASE}/comp/programs`, { name: newProgramName });
    setNewProgramName('');
    setShowNewProgram(false);
    loadPrograms();
  };

  const currentProgram = programs.find(p => p.id === selectedProgram);

  return (
    <div className="flex h-full">
      {/* Left: File Explorer */}
      <div className="w-64 border-r border-border-medium flex flex-col">
        <div className="p-3 border-b border-border-medium">
          <button
            onClick={() => setShowNewProgram(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Program
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {programs.map(program => (
            <div key={program.id}>
              <div
                onClick={() => setSelectedProgram(program.id)}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-bg-secondary transition-colors ${
                  selectedProgram === program.id ? 'bg-bg-secondary' : ''
                }`}
              >
                <Folder className="w-4 h-4 text-accent-warning" />
                <span className="text-sm font-medium truncate">{program.name}</span>
              </div>
              {selectedProgram === program.id && program.files.map(file => (
                <div
                  key={file}
                  onClick={() => loadFile(program.id, file)}
                  className={`flex items-center gap-2 px-3 py-1.5 pl-8 cursor-pointer hover:bg-bg-secondary transition-colors ${
                    selectedFile === file ? 'bg-bg-secondary text-accent-primary' : 'text-text-secondary'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span className="text-xs truncate">{file}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Editor + Output */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border-medium">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-accent-primary" />
            <span className="text-sm font-medium">{currentProgram?.name || 'Compland'}</span>
            {selectedFile && <span className="text-xs text-text-tertiary">— {selectedFile}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveFile}
              disabled={!selectedProgram || !selectedFile}
              className="px-3 py-1.5 text-xs bg-bg-elevated border border-border-medium rounded hover:bg-bg-secondary transition-colors disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={runProgram}
              disabled={!selectedProgram || isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent-success text-white rounded hover:bg-accent-success-hover transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              {isRunning ? 'Running...' : 'Run'}
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <textarea
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            disabled={!selectedFile}
            className="flex-1 p-4 font-mono text-sm bg-bg-primary resize-none outline-none border-none disabled:opacity-50"
            placeholder={selectedFile ? '' : 'Select a file to edit'}
            spellCheck={false}
          />

          <div className="h-40 border-t border-border-medium flex flex-col">
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border-medium bg-bg-secondary">
              <Terminal className="w-3.5 h-3.5 text-text-tertiary" />
              <span className="text-xs font-medium text-text-tertiary">Output</span>
            </div>
            <pre className="flex-1 p-3 overflow-auto font-mono text-xs text-text-secondary whitespace-pre-wrap">
              {output || 'Click Run to execute'}
            </pre>
          </div>
        </div>
      </div>

      {/* New Program Modal */}
      {showNewProgram && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-primary border border-border-medium rounded-xl p-6 w-80">
            <h3 className="text-lg font-medium mb-4">New Program</h3>
            <input
              type="text"
              value={newProgramName}
              onChange={(e) => setNewProgramName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createProgram()}
              placeholder="Program name"
              className="w-full px-3 py-2 bg-bg-secondary border border-border-medium rounded-lg text-sm mb-4 outline-none focus:border-accent-primary"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowNewProgram(false)}
                className="flex-1 px-3 py-2 text-sm border border-border-medium rounded-lg hover:bg-bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createProgram}
                className="flex-1 px-3 py-2 text-sm bg-accent-primary text-white rounded-lg hover:bg-accent-primary-hover transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
