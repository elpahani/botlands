import { useState, useEffect } from 'react';
import { X, Save, Trash2, FileText, CheckCircle, Clock, Play, AlertCircle } from 'lucide-react';
import axios from 'axios';
import type { Task, Document } from '../../types/index.js';

const API_BASE = '/api';

interface TaskEditorPanelProps {
  task: Task | null;
  documents: Document[];
  onClose: () => void;
  onUpdate: () => void;
}

export const TaskEditorPanel: React.FC<TaskEditorPanelProps> = ({
  task,
  documents,
  onClose,
  onUpdate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Task['status']>('waiting');
  const [linkedDocumentId, setLinkedDocumentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setLinkedDocumentId(task.linkedDocumentId || null);
    }
  }, [task]);

  if (!task) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_BASE}/tasks/${task.id}`, {
        title,
        description,
        status,
        linkedDocumentId,
      });
      onUpdate();
    } catch (err) {
      console.error('Failed to update task:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    try {
      await axios.delete(`${API_BASE}/tasks/${task.id}`);
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const statusOptions: { value: Task['status']; label: string; icon: any; color: string }[] = [
    { value: 'waiting', label: 'Waiting', icon: Clock, color: 'text-accent-warning' },
    { value: 'active', label: 'Active', icon: Play, color: 'text-accent-info' },
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-accent-success' },
    { value: 'error', label: 'Error', icon: AlertCircle, color: 'text-accent-danger' },
  ];

  const linkedDoc = documents.find(d => d.id === linkedDocumentId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border shadow-xl p-6"
        style={{ 
          backgroundColor: 'var(--color-bg-primary)', 
          borderColor: 'var(--color-border-medium)',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Task Editor
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border outline-none focus:ring-1 transition-all"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border-medium)',
                color: 'var(--color-text-primary)',
                padding: '10px 12px',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Status
            </label>
            <div className="flex gap-2">
              {statusOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      status === option.value
                        ? 'ring-1 bg-accent-primary/10 border-accent-primary'
                        : 'hover:bg-bg-elevated'
                    }`}
                    style={{
                      borderColor: status === option.value ? 'var(--color-accent-primary)' : 'var(--color-border-medium)',
                      color: status === option.value ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    }}
                  >
                    <Icon className={`w-4 h-4 ${option.color}`} />
                    <span className="text-sm">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border outline-none focus:ring-1 resize-y"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border-medium)',
                color: 'var(--color-text-primary)',
                padding: '10px 12px',
                fontSize: '14px',
                minHeight: '80px',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Linked Document
            </label>
            {linkedDoc ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border"
                style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-medium)' }}
              >
                <FileText className="w-4 h-4" style={{ color: 'var(--color-accent-primary)' }} />
                <span className="text-sm flex-1" style={{ color: 'var(--color-text-primary)' }}>{linkedDoc.title}</span>
                <button onClick={() => setLinkedDocumentId(null)}
                  className="p-1 rounded hover:bg-accent-danger/20 transition-colors"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {documents.length === 0 ? (
                  <div className="text-sm py-2" style={{ color: 'var(--color-text-tertiary)' }}>No documents available</div>
                ) : (
                  documents.slice(0, 5).map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setLinkedDocumentId(doc.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors hover:bg-bg-elevated"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      <FileText className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                      <span className="text-sm truncate">{doc.title}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2.5 rounded-lg border font-medium transition-colors flex items-center gap-2"
              style={{
                borderColor: 'var(--color-accent-danger)',
                color: 'var(--color-accent-danger)',
                backgroundColor: 'transparent',
              }}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border font-medium transition-colors"
              style={{
                borderColor: 'var(--color-border-medium)',
                color: 'var(--color-text-secondary)',
                backgroundColor: 'transparent',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center gap-2"
              style={{
                backgroundColor: 'var(--color-accent-primary)',
                color: 'white',
              }}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
