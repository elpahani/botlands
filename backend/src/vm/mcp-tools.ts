import { z } from 'zod';
import { storageService } from '../services/storage.service.js';
import { spawnVM, stopVM, getExecutionLogs, getRunningExecutions } from './engine.js';

const RunScriptSchema = z.object({
  title: z.string().describe('Task title'),
  scriptContent: z.string().describe('Script content to execute'),
  machineType: z.enum(['python', 'node', 'rust']).default('python').describe('Machine type'),
  dependencies: z.array(z.string()).optional().describe('Dependencies (e.g. ["requests", "numpy>=1.20"])'),
  timeoutMs: z.number().optional().default(30000).describe('Timeout in milliseconds'),
  description: z.string().optional().describe('Task description'),
});

const GetLogsSchema = z.object({
  executionId: z.string().describe('Execution ID'),
});

const ListExecutionsSchema = z.object({
  status: z.enum(['running', 'completed', 'error', 'cancelled']).optional().describe('Filter by status'),
});

const StopExecutionSchema = z.object({
  executionId: z.string().describe('Execution ID to stop'),
});

async function runScriptHandler(params: z.infer<typeof RunScriptSchema>) {
  try {
    const now = new Date().toISOString();
    const time = now.split('T')[1]!.slice(0, 5);
    const date = now.split('T')[0]!;

    const task = storageService.createTask(
      params.title,
      'waiting',
      time,
      date,
      params.description || `VM execution: ${params.title}`,
    );

    task.scriptContent = params.scriptContent;
    if (params.dependencies) {
      task.description += `\nDependencies: ${params.dependencies.join(', ')}`;
    }
    storageService.updateTask(task.id, task);

    const execution = await spawnVM({
      task,
      scriptContent: params.scriptContent,
      machineType: params.machineType,
      timeoutMs: params.timeoutMs,
      dependencies: params.dependencies || [],
    });

    return {
      content: [{ type: 'text' as const, text: `Script started.\nExecution ID: ${execution.id}\nTask ID: ${task.id}\nStatus: ${execution.status}` }],
    };
  } catch (error: any) {
    return {
      content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

async function getLogsHandler(params: z.infer<typeof GetLogsSchema>) {
  try {
    const logs = getExecutionLogs(params.executionId);
    return {
      content: [{ type: 'text' as const, text: logs || '(No logs yet)' }],
    };
  } catch (error: any) {
    return {
      content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

async function listExecutionsHandler(params: z.infer<typeof ListExecutionsSchema>) {
  try {
    const executions = getRunningExecutions();
    const filtered = params.status
      ? executions.filter(e => e.status === params.status)
      : executions;

    const text = filtered.map(e =>
      `[${e.status.toUpperCase()}] ${e.machineType} — ${e.id}\nStarted: ${e.startedAt || 'N/A'}\n${e.output ? 'Output: ' + e.output.substring(0, 200) + '...' : 'No output yet'}`
    ).join('\n\n') || 'No executions found';

    return {
      content: [{ type: 'text' as const, text }],
    };
  } catch (error: any) {
    return {
      content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

async function stopExecutionHandler(params: z.infer<typeof StopExecutionSchema>) {
  try {
    await stopVM(params.executionId);
    return {
      content: [{ type: 'text' as const, text: `Execution ${params.executionId} stopped` }],
    };
  } catch (error: any) {
    return {
      content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

export const vmMcpTools = [
  {
    name: 'run_script' as const,
    description: 'Run a script in an isolated VM environment (Python/Node/Rust)',
    schema: RunScriptSchema,
    handler: runScriptHandler,
  },
  {
    name: 'get_execution_logs' as const,
    description: 'Get logs from a VM execution',
    schema: GetLogsSchema,
    handler: getLogsHandler,
  },
  {
    name: 'list_executions' as const,
    description: 'List all VM executions',
    schema: ListExecutionsSchema,
    handler: listExecutionsHandler,
  },
  {
    name: 'stop_execution' as const,
    description: 'Stop a running VM execution',
    schema: StopExecutionSchema,
    handler: stopExecutionHandler,
  },
];
