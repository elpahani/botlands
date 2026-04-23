import { FolderKanban, Plus, ChevronRight, Trash2 } from 'lucide-react';
import type { Scenario } from '../../types/index.js';
import { api } from '../../api.js';

interface ScenarioSidebarProps {
  scenarios: Scenario[];
  selectedScenario: string | null;
  onSelect: (id: string | null) => void;
  onCreate: () => void;
}

export const ScenarioSidebar: React.FC<ScenarioSidebarProps> = ({
  scenarios,
  selectedScenario,
  onSelect,
  onCreate,
}) => {
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this scenario and all its tasks?')) {
      try {
        await api.delete(`/scenarios/${id}`);
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

  return (
    <div className="w-64 bg-bg-secondary border-r border-border-medium flex flex-col shrink-0"
      style={{ width: 'var(--theme-sidebar-width, 256px)' }}
    >
      {/* Header */}
      <div className="h-9 border-b border-border-medium bg-bg-secondary flex items-center px-3 shrink-0 justify-between">
        <span className="text-sm font-medium text-text-primary">Scenarios</span>
        <button 
          onClick={onCreate}
          className="p-1 rounded-md hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <button
          onClick={() => onSelect(null)}
          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
            selectedScenario === null 
              ? 'bg-accent-primary/10 text-accent-primary' 
              : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span className="text-sm truncate">All Tasks</span>
        </button>

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
            <button
              onClick={(e) => handleDelete(e, scenario.id)}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent-danger/20 text-text-tertiary hover:text-accent-danger transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </button>
        ))}

        {scenarios.length === 0 && (
          <div className="text-center py-8 text-text-tertiary text-xs">
            <FolderKanban className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No scenarios yet</p>
            <button onClick={onCreate} className="mt-2 text-accent-primary hover:underline">Create first scenario</button>
          </div>
        )}
      </div>
    </div>
  );
};
