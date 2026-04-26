import { useState, useEffect, useCallback } from 'react';
import { FolderKanban, Plus } from 'lucide-react';
import { io } from 'socket.io-client';
import type { Scenario, Task, Document } from '../../types/index.js';
import { ScenarioSidebar } from './ScenarioSidebar.js';
import { KanbanBoard } from './KanbanBoard.js';
import { CreateScenarioModal } from './CreateScenarioModal.js';
import { CreateTaskModal } from './CreateTaskModal.js';
import { TaskEditorPanel } from './TaskEditorPanel.js';
import axios from 'axios';

const API_BASE = '/api';

export const WorklandTab: React.FC = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [scenariosRes, tasksRes, docsRes] = await Promise.all([
        axios.get(`${API_BASE}/scenarios`),
        axios.get(`${API_BASE}/tasks`),
        axios.get(`${API_BASE}/documents`).catch(() => ({ data: { documents: [] } }))
      ]);
      
      setScenarios(scenariosRes.data);
      setTasks(tasksRes.data);
      setDocuments(docsRes.data.documents || []);
      setLastUpdate(new Date().toLocaleTimeString());
      console.log('[Workland] Data loaded:', tasksRes.data.length, 'tasks');
    } catch (e) {
      console.error('[Workland] loadData ERROR:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Socket.io real-time updates + fallback polling
  useEffect(() => {
    loadData();

    const socket = io({ transports: ['websocket', 'polling'] });
    
    socket.on('connect', () => {
      console.log('[Workland] Socket connected');
    });

    socket.on('task:created', (task: Task) => {
      console.log('[Workland] Task created:', task.title);
      setTasks(prev => [...prev, task]);
      setLastUpdate(new Date().toLocaleTimeString());
    });

    socket.on('task:updated', (task: Task) => {
      console.log('[Workland] Task updated:', task.title, '→', task.status);
      setTasks(prev => {
        const updated = prev.map(t => t.id === task.id ? { ...t, ...task } : t);
        console.log('[Workland] Updated tasks count:', updated.length);
        return updated;
      });
      setLastUpdate(new Date().toLocaleTimeString());
    });

    socket.on('task:deleted', (data: { id: string }) => {
      console.log('[Workland] Task deleted:', data.id);
      setTasks(prev => prev.filter(t => t.id !== data.id));
    });

    socket.on('workspace_updated', () => {
      console.log('[Workland] Workspace updated - reloading');
      loadData();
    });

    // Fallback polling every 5 seconds
    const pollInterval = setInterval(() => {
      console.log('[Workland] Polling tasks...');
      axios.get(`${API_BASE}/tasks`).then(res => {
        setTasks(res.data);
        setLastUpdate(new Date().toLocaleTimeString() + ' (poll)');
      }).catch(err => {
        console.error('[Workland] Polling error:', err);
      });
    }, 5000);

    return () => {
      socket.disconnect();
      clearInterval(pollInterval);
    };
  }, [loadData]);

  const filteredTasks = selectedScenario 
    ? tasks.filter(t => t.scenarioId === selectedScenario)
    : tasks;

  const taskCounts = {
    waiting: filteredTasks.filter(t => t.status === 'waiting').length,
    active: filteredTasks.filter(t => t.status === 'active').length,
    paused: filteredTasks.filter(t => t.status === 'paused').length,
    completed: filteredTasks.filter(t => t.status === 'completed').length,
    error: filteredTasks.filter(t => t.status === 'error').length,
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-text-secondary">
        <div className="animate-spin w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <ScenarioSidebar 
        scenarios={scenarios}
        tasks={tasks}
        selectedScenario={selectedScenario}
        onSelect={setSelectedScenario}
        onCreate={() => setShowCreateModal(true)}
        onRefresh={loadData}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-9 border-b border-border-medium bg-bg-secondary flex items-center px-6 shrink-0 justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-text-primary flex items-center gap-2">
              <FolderKanban className="w-4 h-4" />
              {selectedScenario 
                ? scenarios.find(s => s.id === selectedScenario)?.title || 'Scenario'
                : 'All Tasks'
              }
            </span>
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <span className="px-2 py-0.5 rounded bg-bg-tertiary">
                ⏳ {taskCounts.waiting}
              </span>
              <span className="px-2 py-0.5 rounded bg-accent-primary/20 text-accent-primary">
                ▶ {taskCounts.active}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500">
                ✅ {taskCounts.completed}
              </span>
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-500">
                ❌ {taskCounts.error}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-tertiary">
              🕐 {lastUpdate}
            </span>
            <button
              onClick={() => setShowTaskModal(true)}
              className="px-3 py-1.5 bg-accent-primary text-text-inverse text-sm font-medium rounded-lg hover:bg-accent-primary/90 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-auto">
          <KanbanBoard 
            tasks={filteredTasks}
            onTaskClick={(task) => setEditingTask(task)}
          />
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateScenarioModal 
          onClose={() => setShowCreateModal(false)}
          onCreate={() => { loadData(); setShowCreateModal(false); }}
        />
      )}

      {showTaskModal && (
        <CreateTaskModal 
          onClose={() => setShowTaskModal(false)}
          onCreate={() => { loadData(); setShowTaskModal(false); }}
          documents={documents}
          scenarioId={selectedScenario || ''}
        />
      )}

      {editingTask && (
        <TaskEditorPanel 
          task={editingTask}
          documents={documents}
          onClose={() => setEditingTask(null)}
          onUpdate={() => { loadData(); setEditingTask(null); }}
        />
      )}
    </div>
  );
};
