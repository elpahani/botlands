import { useState, useEffect } from 'react';
import { FolderKanban, Plus, Play, CheckCircle, AlertCircle, Clock, ListTodo } from 'lucide-react';
import axios from 'axios';
import type { Scenario, Task, Document } from '../../types/index.js';
import { ScenarioSidebar } from './ScenarioSidebar.js';
import { KanbanBoard } from './KanbanBoard.js';
import { CreateScenarioModal } from './CreateScenarioModal.js';
import { CreateTaskModal } from './CreateTaskModal.js';


export const WorklandTab: React.FC = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('[Workland] loadData START');
    setLoading(true);
    try {
      console.log('[Workland] Fetching scenarios...');
      const scenariosRes = await axios.get('/api/scenarios');
      console.log('[Workland] Scenarios received:', scenariosRes.data.length);
      
      console.log('[Workland] Fetching tasks...');
      const tasksRes = await axios.get('/api/tasks');
      console.log('[Workland] Tasks received:', tasksRes.data.length);
      
      setScenarios(scenariosRes.data);
      setTasks(tasksRes.data);
      console.log('[Workland] State updated with', scenariosRes.data.length, 'scenarios');
      
      // Documents — опционально, не ломаем UI если упало
      try {
        console.log('[Workland] Fetching documents...');
        const docsRes = await axios.get('/api/documents');
        console.log('[Workland] Documents received:', docsRes.data?.length || 0);
        setDocuments(docsRes.data?.documents || []);
      } catch (docErr) {
        console.warn('[Workland] Documents fetch failed:', docErr);
      }
    } catch (e) {
      console.error('[Workland] loadData ERROR:', e);
    } finally {
      setLoading(false);
      console.log('[Workland] loadData END');
    }
  };

  const filteredTasks = selectedScenario 
    ? tasks.filter(t => t.scenarioId === selectedScenario)
    : tasks;

  const taskCounts = {
    waiting: filteredTasks.filter(t => t.status === 'waiting').length,
    active: filteredTasks.filter(t => t.status === 'active').length,
    paused: filteredTasks.filter(t => t.status === 'paused').length,
    completed: filteredTasks.filter(t => t.status === 'completed').length,
    error: filteredTasks.filter(t => t.status === 'error').length,
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-text-secondary">
        <div className="animate-spin w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <ScenarioSidebar 
        scenarios={scenarios}
        tasks={tasks}
        selectedScenario={selectedScenario}
        onSelect={setSelectedScenario}
        onCreate={() => setShowCreateModal(true)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-9 border-b border-border-medium bg-bg-secondary flex items-center px-6 shrink-0 justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-text-primary flex items-center gap-2">
              <FolderKanban className="w-4 h-4" />
              {selectedScenario 
                ? scenarios.find(s => s.id === selectedScenario)?.title || 'Scenario'
                : 'All Tasks'
              }
            </span>
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {taskCounts.waiting}</span>
              <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {taskCounts.active}</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {taskCounts.completed}</span>
              <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {taskCounts.error}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (!selectedScenario) {
                  alert('Select a scenario first');
                  return;
                }
                setShowTaskModal(true);
              }}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-accent-primary text-text-inverse rounded-md hover:brightness-110"
            >
              <ListTodo className="w-3 h-3" />
              New Task
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-bg-tertiary text-text-primary rounded-md hover:bg-bg-elevated border border-border-medium"
            >
              <Plus className="w-3 h-3" />
              Scenario
            </button>
          </div>
        </div>

        <KanbanBoard tasks={filteredTasks} onUpdate={loadData} />
      </div>

      {showCreateModal && (
        <CreateScenarioModal 
          onClose={() => setShowCreateModal(false)}
          onCreate={loadData}
        />
      )}

      {showTaskModal && selectedScenario && (
        <CreateTaskModal
          scenarioId={selectedScenario}
          documents={documents}
          onClose={() => setShowTaskModal(false)}
          onCreate={loadData}
        />
      )}
    </div>
  );
};
