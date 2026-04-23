import type { PackageManager } from './package-managers/base.js';
import { PythonPackageManager, NodePackageManager } from './package-managers/index.js';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';

export class DependencyResolver {
  private packageManagers: Map<string, PackageManager> = new Map();

  constructor() {
    this.register(new PythonPackageManager());
    this.register(new NodePackageManager());
  }

  private register(manager: PackageManager): void {
    this.packageManagers.set(manager.language, manager);
  }

  /**
   * Find the appropriate package manager for the given workspace
   */
  resolve(workspacePath: string, language: string): PackageManager | undefined {
    const manager = this.packageManagers.get(language);
    if (manager && manager.detect(workspacePath)) {
      return manager;
    }
    return undefined;
  }

  /**
   * Write dependencies to the workspace if provided as a string
   */
  writeDependencies(workspacePath: string, language: string, dependencies: string[]): void {
    if (language === 'python') {
      const reqFile = join(workspacePath, 'requirements.txt');
      writeFileSync(reqFile, dependencies.join('\n'));
    } else if (language === 'node') {
      const pkgFile = join(workspacePath, 'package.json');
      const pkg = {
        name: 'vmland-task',
        version: '1.0.0',
        dependencies: dependencies.reduce((acc: Record<string, string>, dep: string) => {
          const [name, version = '*'] = dep.split('@');
          if (name) {
            acc[name] = version;
          }
          return acc;
        }, {} as Record<string, string>),
      };
      writeFileSync(pkgFile, JSON.stringify(pkg, null, 2));
    }
  }

  /**
   * Get all registered package managers
   */
  getAll(): PackageManager[] {
    return Array.from(this.packageManagers.values());
  }
}

export const dependencyResolver = new DependencyResolver();
