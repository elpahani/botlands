import { useState } from 'react';
import { Clock, Play, Pause, CheckCircle, AlertCircle } from 'lucide-react';
import type { Task } from '../../types/index.js';
import { TaskCard } from './TaskCard.js';

interface KanbanBoardProps {
  tasks: Task[];
  onUpdate: () => void;
}

const columns = [
  { id: 'waiting', label: 'Backlog', icon: Clock, color: 'text-accent-warning', statuses: ['waiting', 'pending', 'inactive'] },
  { id: 'active', label: 'Active', icon: Play, color: 'text-accent-info', statuses: ['active', 'in_progress'] },
  { id: 'paused', label: 'Paused', icon: Pause, color: 'text-text-tertiary', statuses: ['paused'] },
  { id: 'completed', label: 'Done', icon: CheckCircle, color: 'text-accent-success', statuses: ['completed'] },
  { id: 'error', label: 'Error', icon: AlertCircle, color: 'text-accent-danger', statuses: ['error', 'failed'] },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onUpdate }) => {
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    
    try {
      await fetch(`/api/workland-tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: columnId }),
      });
      onUpdate();
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
      <div className="flex gap-4 h-full min-w-max">
        {columns.map(column => {
          const columnTasks = tasks.filter(t => column.statuses.includes(t.status));
          const Icon = column.icon;
          
          return (
            <div
              key={column.id}
              className={`w-72 flex flex-col rounded-lg border transition-colors ${
                dragOverColumn === column.id 
                  ? 'border-accent-primary bg-accent-primary/5' 
                  : 'border-border-medium bg-bg-secondary'
              }`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-border-medium">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${column.color}`} />
                  <span className="text-sm font-medium text-text-primary">{column.label}</span>
                </div>
                <span className="text-xs text-text-tertiary bg-bg-elevated px-2 py-0.5 rounded-full">
                  {columnTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {columnTasks.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onUpdate={onUpdate}
                  />
                ))}
                
                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-text-tertiary text-xs">
                    <p>Drop tasks here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
