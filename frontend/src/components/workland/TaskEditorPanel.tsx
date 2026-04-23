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

  const statusOptions = [
    { value: 'waiting' as const, label: 'Waiting', icon: Clock },
    { value: 'active' as const, label: 'Active', icon: Play },
    { value: 'completed' as const, label: 'Completed', icon: CheckCircle },
    { value: 'error' as const, label: 'Error', icon: AlertCircle },
  ];

  const linkedDoc = documents.find(d => d.id === linkedDocumentId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] rounded-xl bg-bg-primary border border-border-medium shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-text-primary">
            Task Editor
          </h3>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-bg-elevated text-text-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-bg-secondary border border-border-medium text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Status
            </label>
            <div className="flex gap-2 flex-wrap">
              {statusOptions.map((option) => {
                const Icon = option.icon;
                const isActive = status === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-accent-primary/10 border-accent-primary text-accent-primary ring-1 ring-accent-primary'
                        : 'bg-bg-secondary border-border-medium text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border-medium text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all resize-y text-sm min-h-[80px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Linked Document
            </label>
            {linkedDoc ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-bg-secondary border border-border-medium">
                <FileText className="w-4 h-4 text-accent-primary" />
                <span className="text-sm text-text-primary flex-1 truncate">{linkedDoc.title}</span>
                <button 
                  onClick={() => setLinkedDocumentId(null)}
                  className="p-1 rounded hover:bg-accent-danger/20 text-text-tertiary hover:text-accent-danger transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {documents.length === 0 ? (
                  <div className="text-sm text-text-tertiary py-2">No documents available</div>
                ) : (
                  documents.slice(0, 5).map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setLinkedDocumentId(doc.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors text-sm"
                    >
                      <FileText className="w-4 h-4 text-text-tertiary" />
                      <span className="truncate">{doc.title}</span>
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
              className="px-4 py-2.5 rounded-lg border border-accent-danger text-accent-danger font-medium hover:bg-accent-danger/10 transition-colors flex items-center gap-2 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-border-medium text-text-secondary font-medium hover:bg-bg-elevated hover:text-text-primary transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2.5 rounded-lg bg-accent-primary text-white font-medium hover:bg-accent-primary/90 disabled:opacity-50 transition-all flex items-center gap-2 text-sm"
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
