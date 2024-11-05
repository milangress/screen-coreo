import { Command } from '@tauri-apps/api/shell';
import { type } from '@tauri-apps/api/os';

export class Shell {
  /**
   * Opens a file using the system's default application
   * @param path Path to the file to open
   * @returns Promise that resolves when the file is opened
   */
  async openFile(path: string): Promise<void> {
    try {
      const platform = await type();
      const commandName = platform === 'Windows_NT' ? 'start-command' : 
                         platform === 'Darwin' ? 'open-command' : 
                         'xdg-command';

      const cmd = new Command(commandName, ['-ga', path]);
      await cmd.execute();
    } catch (error) {
      console.error('Failed to open file:', error);
      throw error;
    }
  }

  /**
   * Lists contents of a directory
   * @param path Directory path to list (defaults to current directory)
   * @returns Promise that resolves with the directory contents as a string
   */
  async ls(path: string = '.'): Promise<string> {
    try {
      const platform = await type();
      const commandName = platform === 'Windows_NT' ? 'dir-command' : 'ls-command';
      const args = platform === 'Windows_NT' ? ['/B', path] : ['-la', path];
      
      const cmd = new Command(commandName, args);
      const output = await cmd.execute();
      return output.stdout;
    } catch (error) {
      console.error('Failed to list directory:', error);
      throw error;
    }
  }
}

// Export a default function to get an instance
export default function(): Shell {
  return new Shell();
}