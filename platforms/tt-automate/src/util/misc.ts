import readline from 'readline';

/**
 * Escape a string for use in a shell command.
 */
export const shellEscape = (cmd: string): string =>
  cmd.replace(/(["'$`\\]|\s+)/g, '\\$1');

export const ask = async (message: string, a?: AbortSignal): Promise<string> =>
  new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (a) {
      const onAbort = (): void => {
        a.removeEventListener('abort', onAbort);
        rl.close();
        reject(new Error('aborted'));
      };

      a.addEventListener('abort', onAbort);
    }

    rl.question(message, (answer) => {
      rl.close();
      return resolve(answer);
    });
  });

export const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
