import { useState } from 'react';
import { Clock, Play, Pause, CheckCircle, AlertCircle } from 'lucide-react';
import type { Task } from '../../types/index.js';
import { TaskCard } from './TaskCard.js';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

const columns = [
  { id: 'waiting', label: 'Backlog', icon: Clock, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', statuses: ['waiting', 'pending', 'inactive'] },
  { id: 'active', label: 'Active', icon: Play, color: 'text-blue-500', bgColor: 'bg-blue-500/10', statuses: ['active', 'in_progress'] },
  { id: 'paused', label: 'Paused', icon: Pause, color: 'text-gray-500', bgColor: 'bg-gray-500/10', statuses: ['paused'] },
  { id: 'completed', label: 'Done', icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-500/10', statuses: ['completed'] },
  { id: 'error', label: 'Error', icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-500/10', statuses: ['error', 'failed'] },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onTaskClick }) => {
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
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: columnId }),
      });
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
              className={`w-80 flex flex-col rounded-xl border transition-colors ${
                dragOverColumn === column.id 
                  ? 'border-accent-primary bg-accent-primary/5' 
                  : 'border-border-medium bg-bg-secondary'
              }`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border-medium">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${column.bgColor}`}>
                    <Icon className={`w-4 h-4 ${column.color}`} />
                  </div>
                  <span className="text-sm font-semibold text-text-primary">{column.label}</span>
                </div>
                <span className="text-xs font-medium text-text-tertiary bg-bg-elevated px-2.5 py-1 rounded-full">
                  {columnTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {columnTasks.map(task => (
                  <div 
                    key={task.id}
                    onClick={() => onTaskClick?.(task)}
                    className="cursor-pointer"
                  >
                    <TaskCard 
                      task={task} 
                      onUpdate={() => {}}
                      onEdit={() => onTaskClick?.(task)}
                    />
                  </div>
                ))}
                
                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-text-tertiary text-xs border-2 border-dashed border-border-light rounded-lg">
                    <p className="mb-1">📭 Пусто</p>
                    <p>Перетащите задачу сюда</p>
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
