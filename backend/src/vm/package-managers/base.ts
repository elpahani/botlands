export interface PackageManager {
  readonly name: string;
  readonly language: string;

  /**
   * Install dependencies from a manifest file in the workspace.
   * @param workspacePath - absolute path to the task workspace
   * @returns logs from the install process
   */
  install(workspacePath: string): Promise<string>;

  /**
   * Get the command to run a script inside the workspace.
   * @param workspacePath - absolute path to the task workspace
   * @param scriptFile - relative path to the script inside workspace
   * @returns absolute path to the interpreter binary
   */
  getRunCommand(workspacePath: string, scriptFile: string): { binary: string; args: string[] };

  /**
   * Detect if this package manager should be used for the given workspace.
   * @param workspacePath - absolute path to the task workspace
   */
  detect(workspacePath: string): boolean;
}

export abstract class BasePackageManager implements PackageManager {
  abstract readonly name: string;
  abstract readonly language: string;

  abstract install(workspacePath: string): Promise<string>;
  abstract getRunCommand(workspacePath: string, scriptFile: string): { binary: string; args: string[] };
  abstract detect(workspacePath: string): boolean;

  protected log(msg: string): void {
    console.log(`[${this.name}] ${msg}`);
  }
}
