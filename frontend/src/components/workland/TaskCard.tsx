import { useState } from 'react';
import { GripVertical, FileText, Bot, Trash2, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';
import type { Task } from '../../types/index.js';

interface TaskCardProps {
  task: Task;
  onUpdate: () => void;
  onEdit?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', task.id);
    setDragging(true);
  };

  const handleDragEnd = () => {
    setDragging(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    try {
      await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      onUpdate();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const statusColors = {
    inactive: 'border-text-tertiary',
    waiting: 'border-accent-warning',
    active: 'border-accent-info',
    paused: 'border-text-tertiary',
    completed: 'border-accent-success',
    error: 'border-accent-danger',
  };


  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        bg-bg-primary border-l-2 rounded-lg p-3 cursor-grab active:cursor-grabbing
        hover:shadow-md transition-all
        ${statusColors[task.status] || 'border-text-tertiary'}
        ${dragging ? 'opacity-50 rotate-2' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-text-tertiary mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{task.title}</p>
          <p className="text-xs text-text-tertiary mt-0.5 line-clamp-2">{task.description}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-0.5 rounded hover:bg-bg-elevated text-text-tertiary shrink-0"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {onEdit && (
          <button
            onClick={() => onEdit(task)}
            className="p-0.5 rounded hover:bg-bg-elevated text-text-tertiary shrink-0"
          >
            <Edit3 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border-light space-y-2">
          {task.description && (
            <p className="text-xs text-text-secondary leading-relaxed">{task.description}</p>
          )}

          {/* Linked Document */}
          {task.linkedDocumentId && (
            <a 
              href={`/documents/${task.linkedDocumentId}`}
              className="flex items-center gap-2 p-2 rounded bg-bg-elevated hover:bg-bg-secondary transition-colors group"
            >
              <FileText className="w-4 h-4 text-accent-primary" />
              <span className="text-xs text-text-secondary truncate group-hover:text-accent-primary transition-colors">
                Open linked document
              </span>
            </a>
          )}

          {/* Assignee & Meta */}
          <div className="flex items-center justify-between text-xs text-text-tertiary">
            <div className="flex items-center gap-2">
              {task.assignee && (
                <span className="flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  {task.assignee}
                </span>
              )}
              <span>{new Date(task.createdAt || '').toLocaleDateString()}</span>
            </div>
            <button
              onClick={handleDelete}
              className="p-1 rounded hover:bg-accent-danger/20 text-text-tertiary hover:text-accent-danger transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
