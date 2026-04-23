import { mkdirSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import type { PackageManager } from './package-managers/base.js';

const MACHINE_POOL_PATH = process.env.VM_BASE_PATH || '/app/vmland/machines';

interface Machine {
  id: string;
  type: 'python' | 'node' | 'rust';
  workspacePath: string;
  venvPath: string;
  createdAt: string;
  lastUsedAt: string;
}

class MachinePool {
  private machines = new Map<string, Machine>();

  constructor() {
    this.ensurePoolPath();
  }

  private ensurePoolPath(): void {
    mkdirSync(MACHINE_POOL_PATH, { recursive: true });
  }

  getOrCreateMachine(type: 'python' | 'node' | 'rust', executionId: string): Machine {
    const machineId = `${type}-${executionId}`;
    
    if (this.machines.has(machineId)) {
      const machine = this.machines.get(machineId)!;
      machine.lastUsedAt = new Date().toISOString();
      return machine;
    }

    const machine: Machine = {
      id: machineId,
      type,
      workspacePath: join(MACHINE_POOL_PATH, machineId, 'workspace'),
      venvPath: join(MACHINE_POOL_PATH, machineId, '.venv'),
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
    };

    mkdirSync(machine.workspacePath, { recursive: true });
    this.machines.set(machineId, machine);
    return machine;
  }

  async setupDependencies(machine: Machine, packageManager: PackageManager): Promise<string> {
    return await packageManager.install(machine.workspacePath);
  }

  cleanup(executionId: string, type: string): void {
    setTimeout(() => {
      const machineId = `${type}-${executionId}`;
      const machine = this.machines.get(machineId);
      if (machine) {
        const lastUsed = new Date(machine.lastUsedAt).getTime();
        const now = Date.now();
        const hoursSinceLastUse = (now - lastUsed) / (1000 * 60 * 60);
        
        if (hoursSinceLastUse > 24) {
          rmSync(join(MACHINE_POOL_PATH, machineId), { recursive: true, force: true });
          this.machines.delete(machineId);
        }
      }
    }, 24 * 60 * 60 * 1000);
  }

  getMachine(executionId: string, type: string): Machine | undefined {
    return this.machines.get(`${type}-${executionId}`);
  }
}

export const machinePool = new MachinePool();
