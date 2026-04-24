import { z } from 'zod';
import { createCompTask, executeTask, getTask, getTaskLogs, listTasks, stopTask } from './task-manager.js';

const RunScriptSchema = z.object({
  title: z.string().describe('Task title'),
  scriptContent: z.string().describe('Script content to execute'),
  language: z.enum(['python', 'node', 'rust']).default('python').describe('Language'),
  dependencies: z.array(z.string()).optional().describe('Dependencies (e.g. ["requests", "numpy>=1.20"])'),
});

const GetLogsSchema = z.object({
  taskId: z.string().describe('Task ID'),
});

const ListTasksSchema = z.object({
  status: z.enum(['running', 'completed', 'error', 'cancelled', 'waiting']).optional().describe('Filter by status'),
});

const StopTaskSchema = z.object({
  taskId: z.string().describe('Task ID to stop'),
});

export const vmMcpTools = [
  {
    name: 'run_script' as const,
    description: 'Run a script in VM (Python/Node/Rust)',
    schema: RunScriptSchema,
    handler: async (params: z.infer<typeof RunScriptSchema>) => {
      try {
        const task = createCompTask(
          params.title,
          params.scriptContent,
          params.language,
          params.dependencies || []
        );
        await executeTask(task.id);
        return {
          content: [{ type: 'text' as const, text: `Task started.\nID: ${task.id}\nStatus: ${task.status}` }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    },
  },
  {
    name: 'get_task_logs' as const,
    description: 'Get logs from a VM task',
    schema: GetLogsSchema,
    handler: async (params: z.infer<typeof GetLogsSchema>) => {
      try {
        const logs = getTaskLogs(params.taskId);
        return {
          content: [{ type: 'text' as const, text: logs || '(No logs yet)' }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    },
  },
  {
    name: 'list_vm_tasks' as const,
    description: 'List all VM tasks',
    schema: ListTasksSchema,
    handler: async (params: z.infer<typeof ListTasksSchema>) => {
      try {
        const tasks = listTasks();
        const filtered = params.status
          ? tasks.filter(e => e.status === params.status)
          : tasks;

        const text = filtered.map(e =>
          `[${e.status.toUpperCase()}] ${e.language} — ${e.id}\nStarted: ${e.startedAt || 'N/A'}\n${e.output ? 'Output: ' + e.output.substring(0, 200) + '...' : 'No output yet'}`
        ).join('\n\n') || 'No tasks found';

        return {
          content: [{ type: 'text' as const, text }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    },
  },
  {
    name: 'stop_vm_task' as const,
    description: 'Stop a running VM task',
    schema: StopTaskSchema,
    handler: async (params: z.infer<typeof StopTaskSchema>) => {
      try {
        stopTask(params.taskId);
        return {
          content: [{ type: 'text' as const, text: `Task ${params.taskId} stopped` }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    },
  },
];
