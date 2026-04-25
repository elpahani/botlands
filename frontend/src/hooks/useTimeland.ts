import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import type { Task } from '../types/index.js';

const API_BASE = '/api';

// Module-level socket singleton
let globalSocket: ReturnType<typeof io> | null = null;
let socketRefCount = 0;

function acquireSocket() {
  if (!globalSocket) {
    globalSocket = io({ transports: ['websocket', 'polling'] });
  }
  socketRefCount++;
  return globalSocket;
}

function releaseSocket() {
  socketRefCount--;
  if (socketRefCount <= 0 && globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
  }
}

function extractCategories(taskList: Task[]): Category[] {
  const catMap = new Map<string, { count: number; color: string }>();
  
  taskList.forEach(task => {
    (task.categories || []).forEach(cat => {
      const existing = catMap.get(cat);
      if (existing) {
        existing.count++;
      } else {
        const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
        const colorIndex = cat.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        catMap.set(cat, { count: 1, color: colors[colorIndex] });
      }
    });
  });

  return Array.from(catMap.entries()).map(([name, data]) => ({
    id: name,
    name,
    color: data.color,
    count: data.count,
  }));
}

export function useTimeland() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Categories from ALL tasks
  const categories = useMemo(() => extractCategories(allTasks), [allTasks]);

  // Filtered tasks
  const tasks = useMemo(() => {
    if (!selectedCategory) return allTasks;
    return allTasks.filter(t => t.categories?.includes(selectedCategory));
  }, [allTasks, selectedCategory]);

  const loadTasks = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/tasks`);
      setAllTasks(res.data || []);
    } catch (e) {
      console.error('Failed to load tasks:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // WebSocket
  useEffect(() => {
    const socket = acquireSocket();

    const onTaskCreated = (task: Task) => {
      setAllTasks(prev => {
        if (prev.find(t => t.id === task.id)) return prev;
        return [...prev, task];
      });
    };

    const onTaskUpdated = (task: Task) => {
      setAllTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...task } : t));
    };

    const onTaskDeleted = (data: { id: string }) => {
      setAllTasks(prev => prev.filter(t => t.id !== data.id));
    };

    socket.on('task:created', onTaskCreated);
    socket.on('task:updated', onTaskUpdated);
    socket.on('task:deleted', onTaskDeleted);

    loadTasks();

    return () => {
      socket.off('task:created', onTaskCreated);
      socket.off('task:updated', onTaskUpdated);
      socket.off('task:deleted', onTaskDeleted);
      releaseSocket();
    };
  }, [loadTasks]);

  return {
    tasks,
    allTasks,
    categories,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    refresh: loadTasks,
  };
}

export type Category = {
  id: string;
  name: string;
  color: string;
  count: number;
};
