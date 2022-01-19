import * as path from 'path';
import { GetGuardoni } from '../guardoni';

describe.skip('Guardoni', () => {
  let experimentId: string;
  const guardoni = GetGuardoni({
    headless: false,
    verbose: false,
    basePath: path.resolve(__dirname, '../../../'),
    profile: 'test-profile',
    extensionDir: path.resolve(__dirname, '../../../build/extension'),
  });

  describe('Register an experiment', () => {
    test('fails when the file path is wrong', async () => {
      // mocks
      // read csv from filesystem
      // fsMock.readFile.mockImplementationOnce((path, _opts, cb) => {
      //   cb(new Error('Can\'t find the file'), null);
      // });

      await expect(
        guardoni
          .cli({
            run: 'register-csv',
            file: './fake-file',
            type: 'chiaroscuro',
          })
          .run()
      ).resolves.toMatchObject({
        _tag: 'Left',
        left: {
          message: 'Failed to read csv file ./fake-file',
        },
      });
    });

    test('fails when csv file is incompatible with type "chiaroscuro"', async () => {
      await expect(
        guardoni
          .cli({
            run: 'register-csv',
            file: './experiments/experiment-comparison.csv',
            type: 'chiaroscuro',
          })
          .run()
      ).resolves.toMatchObject({
        _tag: 'Left',
        left: {
          name: 'CSVParseError',
          message:
            'The given CSV is not compatible with directive "chiaroscuro"',
        },
      });
    });

    test('fails when csv file is incompatible with type "comparison"', async () => {
      await expect(
        guardoni
          .cli({
            run: 'register-csv',
            file: './experiments/experiment-chiaroscuro.csv',
            type: 'comparison',
          })
          .run()
      ).resolves.toMatchObject({
        _tag: 'Left',
        left: {
          name: 'CSVParseError',
          message:
            'The given CSV is not compatible with directive "comparison"',
        },
      });
    });

    test('success with type comparison and proper csv file', async () => {
      const result: any = await guardoni
        .cli({
          run: 'register-csv',
          type: 'comparison',
          file: './experiments/experiment-comparison.csv',
        })
        .run();

      expect(result).toMatchObject({
        _tag: 'Right',
        right: {
          message: 'Experiment already available',
        },
      });

      experimentId = result.right.values.experimentId;
    });
  });

  describe('experiment', () => {
    test('fails when experiment id is empty', async () => {
      await expect(
        guardoni.cli({ run: 'experiment', experiment: '' }).run()
      ).resolves.toMatchObject({
        _tag: 'Left',
        left: {
          message: 'Run experiment validation',
          details: ['Invalid value "" supplied to : NonEmptyString'],
        },
      });
    });

    test('succeed when experimentId is valid', async () => {
      const result: any = await guardoni
        .cli({ run: 'experiment', experiment: experimentId })
        .run();

      expect(result).toMatchObject({
        _tag: 'Right',
        right: {
          message: 'Experiment completed',
          values: {},
        },
      });
    });
  });
});
