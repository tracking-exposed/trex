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

export interface Country {
  countryCode: string;
  countryName: string;
}

export const loadCountriesCSV = async(path: string): Promise<Country[]> => {
  const csv = await readFile(path, 'utf8');
  const countries = parseCSV(csv, { columns: true }) as any[];
  const result: Country[] = [];

  for (const country of countries) {
    if (country.countryCode && country.countryName) {
      result.push({
        countryCode: country.countryCode,
        countryName: country.countryName,
      });
    } else {
      throw new Error('invalid country found in CSV');
    }
  }

  return result;
};
