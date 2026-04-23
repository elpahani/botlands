import { useState } from 'react';
import { X, ListTodo, Link2, FileText, Loader2 } from 'lucide-react';
import axios from 'axios';
import type { Document } from '../../types/index.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface CreateTaskModalProps {
  scenarioId: string;
  documents: Document[];
  onClose: () => void;
  onCreate: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  scenarioId,
  documents,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkedDocumentId, setLinkedDocumentId] = useState<string | null>(null);
  const [showDocSelector, setShowDocSelector] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE}/tasks`, {
        title,
        description,
        scenarioId,
        linkedDocumentId,
        status: 'waiting',
      });
      onCreate();
      onClose();
    } catch (err) {
      console.error('Failed to create task:', err);
      alert('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const linkedDoc = documents.find(d => d.id === linkedDocumentId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-bg-primary border border-border-medium shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-accent-primary" />
            New Task
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-bg-elevated text-text-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              className="w-full h-9 px-3 rounded-lg bg-bg-secondary border border-border-medium text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task..."
              rows={3}
              className="w-full min-h-[80px] px-3 py-2 resize-y rounded-lg bg-bg-secondary border border-border-medium text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all resize-none"
            />
          </div>

          {/* Document Linkage */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Linked Document
            </label>

            {linkedDoc ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-bg-secondary border border-border-medium">
                <FileText className="w-4 h-4 text-accent-primary" />
                <span className="text-sm text-text-primary flex-1 truncate">{linkedDoc.title}</span>
                <button
                  type="button"
                  onClick={() => setLinkedDocumentId(null)}
                  className="p-1 rounded hover:bg-accent-danger/20 text-text-tertiary hover:text-accent-danger transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDocSelector(!showDocSelector)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border-medium bg-bg-secondary text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
                >
                  <Link2 className="w-4 h-4" />
                  <span className="text-sm">Link to document...</span>
                </button>

                {showDocSelector && (
                  <div className="absolute z-10 w-full mt-1 rounded-lg bg-bg-primary border border-border-medium shadow-lg max-h-48 overflow-y-auto">
                    {documents.length === 0 ? (
                      <div className="p-3 text-sm text-text-tertiary text-center">
                        No documents available
                      </div>
                    ) : (
                      documents.map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => {
                            setLinkedDocumentId(doc.id);
                            setShowDocSelector(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-bg-elevated transition-colors"
                        >
                          <FileText className="w-4 h-4 text-text-tertiary shrink-0" />
                          <span className="text-sm text-text-primary truncate">{doc.title}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-border-medium text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || loading}
              className="flex-1 px-4 py-2 rounded-lg bg-accent-primary text-white font-medium hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
