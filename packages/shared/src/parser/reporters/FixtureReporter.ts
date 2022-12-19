import fs from 'fs';
import path from 'path';
import { getDate, getMonth, getYear } from 'date-fns';
import { ErrorReporter } from './reporter.type';

export const FixtureReporter = (basePath: string): ErrorReporter<any> => {
  return {
    report: (e) => {
      const now = new Date();
      const day = getDate(now);
      const month = getMonth(now);
      const year = getYear(now);
      const entryNature = e.html.nature?.type ?? e.html.type ?? 'failed';
      const fixtureFolderPath = path.resolve(
        basePath,
        `${year}/${month}/${day}`,
        entryNature
      );

      // ensure fixtures folder path exists
      if (!fs.existsSync(fixtureFolderPath)) {
        fs.mkdirSync(fixtureFolderPath, { recursive: true });
      }

      const fixturePath = path.resolve(fixtureFolderPath, `${e.html.id}.json`);

      fs.writeFileSync(
        fixturePath,
        JSON.stringify({
          sources: [e.html],
          metadata: {},
        })
      );
    },
  };
};
