import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

import { Plus, Trash2, ListTodo, ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { Scenario, Task } from '../../types/index.js';

interface ScenarioSidebarProps {
  scenarios: Scenario[];
  tasks: Task[];
  selectedScenario: string | null;
  onSelect: (id: string | null) => void;
  onCreate: () => void;
}

export const ScenarioSidebar: React.FC<ScenarioSidebarProps> = ({
  scenarios,
  tasks,
  selectedScenario,
  onSelect,
  onCreate,
}) => {
  const [scenariosOpen, setScenariosOpen] = useState(true);
  const [tasksOpen, setTasksOpen] = useState(true);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this scenario and all its tasks?')) {
      try {
        await axios.delete(`${API_BASE}/scenarios/${id}`);
        onSelect(null);
      } catch (err) {
        console.error('Failed to delete scenario:', err);
      }
    }
  };

  const statusColors = {
    inactive: 'bg-text-tertiary',
    active: 'bg-accent-success',
    paused: 'bg-accent-warning',
    completed: 'bg-accent-primary',
    error: 'bg-accent-danger',
  };

  const taskStatusColors = {
    inactive: 'bg-text-tertiary',
    waiting: 'bg-accent-warning',
    active: 'bg-accent-info',
    paused: 'bg-accent-warning',
    completed: 'bg-accent-success',
    error: 'bg-accent-danger',
  };

  return (
    <div className="w-64 bg-bg-secondary border-r border-border-medium flex flex-col shrink-0"
      style={{ width: 'var(--theme-sidebar-width, 256px)' }}
    >
      <div className="h-9 border-b border-border-medium bg-bg-secondary flex items-center px-3 shrink-0 justify-between">
        <span className="text-sm font-medium text-text-primary">Workland</span>
        <button 
          onClick={onCreate}
          className="p-1 rounded-md hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* All Tasks */}
        <button
          onClick={() => onSelect(null)}
          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
            selectedScenario === null 
              ? 'bg-accent-primary/10 text-accent-primary' 
              : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span className="text-sm font-medium truncate">All Tasks</span>
          <span className="ml-auto text-xs text-text-tertiary bg-bg-elevated px-1.5 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </button>

        {/* Scenarios Section */}
        <div className="mt-3">
          <button 
            onClick={() => setScenariosOpen(!scenariosOpen)}
            className="w-full flex items-center gap-1 px-2 py-1 text-xs text-text-tertiary uppercase tracking-wider font-semibold hover:text-text-secondary transition-colors"
          >
            {scenariosOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Scenarios
            <span className="ml-auto text-xs text-text-tertiary">{scenarios.length}</span>
          </button>
          
          {scenariosOpen && (
            <div className="mt-1 space-y-0.5">
              {scenarios.map(scenario => (
                <button
                  key={scenario.id}
                  onClick={() => onSelect(scenario.id)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors group ${
                    selectedScenario === scenario.id 
                      ? 'bg-accent-primary/10 text-accent-primary' 
                      : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${statusColors[scenario.status] || 'bg-text-tertiary'}`} />
                  <span className="text-sm truncate flex-1 text-left">{scenario.title}</span>
                  <span className="text-xs text-text-tertiary bg-bg-elevated px-1.5 py-0.5 rounded-full">
                    {scenario.taskIds?.length || 0}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, scenario.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent-danger/20 text-text-tertiary hover:text-accent-danger transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </button>
              ))}

              {scenarios.length === 0 && (
                <div className="text-center py-4 text-text-tertiary text-xs">
                  <p>No scenarios yet</p>
                  <button onClick={onCreate} className="mt-1 text-accent-primary hover:underline">Create first</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tasks Section */}
        <div className="mt-3">
          <button 
            onClick={() => setTasksOpen(!tasksOpen)}
            className="w-full flex items-center gap-1 px-2 py-1 text-xs text-text-tertiary uppercase tracking-wider font-semibold hover:text-text-secondary transition-colors"
          >
            {tasksOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Tasks
            <span className="ml-auto text-xs text-text-tertiary">{tasks.length}</span>
          </button>
          
          {tasksOpen && (
            <div className="mt-1 space-y-0.5">
              {tasks.slice(0, 10).map(task => (
                <div
                  key={task.id}
                  className="w-full flex items-center gap-2 px-3 py-1 rounded-lg text-text-secondary"
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${taskStatusColors[task.status] || 'bg-text-tertiary'}`} />
                  <span className="text-xs truncate flex-1">{task.title}</span>
                </div>
              ))}
              
              {tasks.length === 0 && (
                <div className="text-center py-4 text-text-tertiary text-xs">
                  <p>No tasks yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};