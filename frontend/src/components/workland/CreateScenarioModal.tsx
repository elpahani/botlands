import { useState } from 'react';
import { X, FolderKanban } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface CreateScenarioModalProps {
  onClose: () => void;
  onCreate: () => void;
}

// CSS классы цветов - только accent цвета темы
const colorClasses = [
  'bg-accent-primary',
  'bg-accent-success', 
  'bg-accent-warning',
  'bg-accent-danger',
  'bg-accent-secondary',
  'bg-accent-info',
];

const colorValues = [
  'accent-primary',
  'accent-success',
  'accent-warning',
  'accent-danger',
  'accent-secondary',
  'accent-info',
];

export const CreateScenarioModal: React.FC<CreateScenarioModalProps> = ({
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(0); // index in colorClasses
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setLoading(true);
    try {
      // Отправляем значение CSS переменной
      await axios.post(`${API_BASE}/scenarios`, { 
        title, 
        description, 
        color: colorValues[selectedColor]
      });
      onCreate();
      onClose();
    } catch (err) {
      console.error('Failed to create scenario:', err);
      alert('Failed to create scenario');
    } finally {
      setLoading(false);
    }
  };

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
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter scenario title..."
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
              placeholder="Describe the scenario..."
              rows={3}
              className="w-full min-h-[80px] px-3 py-2 resize-y rounded-lg bg-bg-secondary border border-border-medium text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Color
            </label>
            <div className="flex gap-2">
              {colorClasses.map((colorClass, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedColor(i)}
                  className={`w-8 h-8 rounded-lg ${colorClass} transition-all hover:scale-110 ${
                    selectedColor === i 
                      ? 'ring-2 ring-offset-2 ring-offset-bg-primary ring-accent-primary scale-110' 
                      : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
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
              className="flex-1 px-4 py-2 rounded-lg bg-accent-primary text-white font-medium hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
