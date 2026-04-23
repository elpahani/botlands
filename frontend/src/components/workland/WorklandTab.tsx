import { useState, useEffect } from 'react';
import { ListTodo, Plus, Play, Pause, CheckCircle, AlertCircle, Clock, FolderKanban } from 'lucide-react';
import { api } from '../../api.js';
import type { Scenario, Task } from '../../types/index.js';
import { ScenarioSidebar } from './ScenarioSidebar.js';
import { KanbanBoard } from './KanbanBoard.js';
import { TaskCard } from './TaskCard.js';
import { CreateScenarioModal } from './CreateScenarioModal.js';

export const WorklandTab: React.FC = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [scenariosRes, tasksRes] = await Promise.all([
        api.get('/scenarios'),
        api.get('/workland-tasks')
      ]);
      setScenarios(scenariosRes.data);
      setTasks(tasksRes.data);
    } catch (e) {
      console.error('Failed to load workland data:', e);
    } finally {
      setLoading(false);
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
      {/* Left Sidebar - Scenarios */}
      <ScenarioSidebar 
        scenarios={scenarios}
        selectedScenario={selectedScenario}
        onSelect={setSelectedScenario}
        onCreate={() => setShowCreateModal(true)}
      />

      {/* Right Panel - Kanban Board */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
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
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-accent-primary text-text-inverse rounded-md hover:brightness-110"
          >
            <Plus className="w-3 h-3" />
            New Task
          </button>
        </div>

        {/* Kanban Columns */}
        <KanbanBoard tasks={filteredTasks} onUpdate={loadData} />
      </div>

      {/* Create Scenario Modal */}
      {showCreateModal && (
        <CreateScenarioModal 
          onClose={() => setShowCreateModal(false)}
          onCreate={loadData}
        />
      )}
    </div>
  );
};
