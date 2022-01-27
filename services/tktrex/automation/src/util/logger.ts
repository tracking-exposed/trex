/* eslint-disable no-console */

export interface Logger {
  // eslint-disable-next-line
  log(...lines: unknown[]): void;
}

export const createLogger = (
  print: (str: string) => void = console.log,
): Logger => {
  let lastLineIsBlank = true;
  let printBlankLine = false;

  const logStr = (...strings: string[]): void => {
    if (strings.length > 1) {
      if (!lastLineIsBlank) {
        print('');
        lastLineIsBlank = true;
        printBlankLine = false;
      }
    }

    for (const str of strings) {
      if (str) {
        lastLineIsBlank = false;
      }
      if (printBlankLine) {
        print('');
        printBlankLine = false;
      }
      print(str);
    }

    if (strings.length > 1) {
      printBlankLine = true;
    }
  };

  const log = (...args: unknown[]): void => {
    const lines: string[] = [];

    for (const arg of args) {
      if (typeof arg === 'string') {
        lines.push(arg);
      } else {
        lines.push(
          ...JSON.stringify(arg, null, 2)
            .split('\n')
            .map((line) => `|> ${line}`),
        );
      }
    }

    logStr(...lines);
  };

  const logger: Logger = {
    log,
  };

  return logger;
};

export default createLogger;
