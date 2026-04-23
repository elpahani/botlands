import { useState } from 'react';
import { X, FolderKanban } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface CreateScenarioModalProps {
  onClose: () => void;
  onCreate: () => void;
}

const COLORS = [
  { name: 'accent-primary',  class: 'bg-[#667eea]' },
  { name: 'accent-success',  class: 'bg-[#10b981]' },
  { name: 'accent-warning',  class: 'bg-[#f97316]' },
  { name: 'accent-danger',   class: 'bg-[#ef4444]' },
  { name: 'accent-secondary',class: 'bg-[#8b5cf6]' },
  { name: 'accent-info',     class: 'bg-[#06b6d4]' },
];

export const CreateScenarioModal: React.FC<CreateScenarioModalProps> = ({
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [colorIdx, setColorIdx] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[CreateScenario] Submit:', { title, description, color: COLORS[colorIdx].name });
    if (!title.trim()) {
      console.log('[CreateScenario] Title empty, aborting');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/scenarios`, {
        title,
        description,
        color: COLORS[colorIdx].name,
      });
      console.log('[CreateScenario] Success:', response.data);
      await onCreate(); // Сначала обновляем данные
      onClose();        // Потом закрываем модалку
    } catch (err) {
      console.error('[CreateScenario] Failed:', err);
      alert('Failed to create scenario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] rounded-xl border p-6 shadow-2xl"
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderColor: 'var(--color-border-medium)',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3
            className="text-lg font-bold flex items-center gap-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <FolderKanban className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
            New Scenario
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter scenario title..."
              className="w-full rounded-lg border outline-none focus:ring-1 transition-all"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border-medium)',
                color: 'var(--color-text-primary)',
                padding: '0 12px',
                height: '40px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              autoFocus
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the scenario..."
              className="w-full rounded-lg border outline-none focus:ring-1 resize-y"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border-medium)',
                color: 'var(--color-text-primary)',
                padding: '10px 12px',
                fontSize: '14px',
                minHeight: '80px',
                height: '80px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setColorIdx(i)}
                  className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${color.class} ${
                    colorIdx === i
                      ? 'ring-2 ring-offset-2 scale-110'
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
              className="flex-1 px-4 py-2.5 rounded-lg border font-medium transition-colors"
              style={{
                borderColor: 'var(--color-border-medium)',
                color: 'var(--color-text-secondary)',
                backgroundColor: 'transparent',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || loading}
              className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--color-accent-primary)',
                color: '#ffffff',
                fontWeight: 500,
              }}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
