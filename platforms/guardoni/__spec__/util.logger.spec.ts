import createLogger, { Logger } from '@util/logger';

const testLogger = (
  testFn: (logger: Logger) => void,
  expected: string[]
): void => {
  const lines: string[] = [];
  const logger = createLogger((str) => lines.push(str));
  testFn(logger);
  expect(lines).toEqual(expected);
};

describe('the default logger', () => {
  it('logs a line', () => {
    testLogger(({ log }) => log('test'), ['test']);
  });

  it('logs two lines at once', () => {
    testLogger(
      ({ log }) => {
        log('a', 'b');
      },
      ['a', 'b']
    );
  });

  it('logs two lines one after another', () => {
    testLogger(
      ({ log }) => {
        log('a');
        log('b');
      },
      ['a', 'b']
    );
  });

  it('automatically jumps one line before a group', () => {
    testLogger(
      ({ log }) => {
        log('a');
        log('b', 'c');
      },
      ['a', '', 'b', 'c']
    );
  });

  it('automatically jumps one line after a group', () => {
    testLogger(
      ({ log }) => {
        log('a');
        log('b', 'c');
        log('d');
      },
      ['a', '', 'b', 'c', '', 'd']
    );
  });

  it('only jumps one line between two groups', () => {
    testLogger(
      ({ log }) => {
        log('b', 'c');
        log('d', 'e');
      },
      ['b', 'c', '', 'd', 'e']
    );
  });

  it('jumps one line after a JSON group', () => {
    testLogger(
      ({ log }) => {
        log('a');
        log('b', { a: 1, b: 2 });
        log('d');
      },
      ['a', '', 'b', '|> {', '|>   "a": 1,', '|>   "b": 2', '|> }', '', 'd']
    );
  });

  it('serializes stuff that is not string', () => {
    testLogger(
      ({ log }) => {
        log({ a: 1, b: 2 });
      },
      ['|> {', '|>   "a": 1,', '|>   "b": 2', '|> }']
    );
  });

  it('groups serialized stuff that is not string', () => {
    testLogger(
      ({ log }) => {
        log('x');
        log({ a: 1, b: 2 });
      },
      ['x', '', '|> {', '|>   "a": 1,', '|>   "b": 2', '|> }']
    );
  });
});
