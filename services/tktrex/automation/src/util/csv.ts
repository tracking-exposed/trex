import { readFile } from 'fs/promises';

import parseCSV from 'csv-parse/lib/sync';

export const loadQueriesCSV = async(path: string): Promise<string[]> => {
  const csv = await readFile(path, 'utf8');
  const queries = parseCSV(csv, { columns: true }) as Array<Record<string, string | undefined>>;

  return queries.map(({ query }) => {
    if (!query) {
      throw new Error('no query in CSV');
    }

    return query;
  });
};
