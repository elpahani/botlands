import { useState } from 'react';
import { X, FolderKanban } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface CreateScenarioModalProps {
  onClose: () => void;
  onCreate: () => void;
}

export const CreateScenarioModal: React.FC<CreateScenarioModalProps> = ({
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#667eea');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/scenarios`, { title, description, color });
      onCreate();
      onClose();
    } catch (err) {
      console.error('Failed to create scenario:', err);
    } finally {
      setLoading(false);
    }
  };

  const colors = [
    '#667eea', '#10b981', '#f97316', '#ec4899', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md rounded-xl bg-bg-primary border border-border-medium shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-accent-primary" />
            New Scenario
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-bg-elevated text-text-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Project Alpha"
              className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border-medium text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this scenario about?"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border-medium text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Color</label>
            <div className="flex gap-2">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c ? 'border-text-primary scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-border-medium text-text-secondary hover:bg-bg-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || loading}
              className="flex-1 px-4 py-2 rounded-lg bg-accent-primary text-text-inverse hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
