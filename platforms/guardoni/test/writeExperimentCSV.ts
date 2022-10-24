import { Step } from '@shared/models/Step';
import { csvStringifyTE } from '@shared/utils/csv.utils';
import { throwTE } from '@shared/utils/task.utils';
import * as path from 'path';
import * as fs from 'fs';
import { NonEmptyString } from 'io-ts-types/lib/NonEmptyString';

export interface TestCSV {
  output: NonEmptyString;
  remove: () => void;
}

export const writeExperimentCSV = async (
  basePath: string,
  steps: Step[],
  fileName: string
): Promise<TestCSV> => {
  const experimentCSVContent = await throwTE(
    csvStringifyTE(steps, {
      header: true,
      encoding: 'utf-8',
    })
  );
  const output = path.resolve(
    basePath,
    'experiments',
    `${fileName}.csv`
  ) as NonEmptyString;

  fs.writeFileSync(output, experimentCSVContent, 'utf-8');

  const remove = (): void => {
    fs.rmSync(output);
  };
  return {
    output,
    remove,
  };
};
