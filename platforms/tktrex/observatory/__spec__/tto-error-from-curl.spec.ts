import { readdirSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { parseCurlResponse } from '../src/util';

const examplesDir = join(__dirname, './fixtures/tto-error-from-curl');
const examples = readdirSync(examplesDir, {
  withFileTypes: true,
}).filter((dirent) => dirent.isFile() && !dirent.name.endsWith('.json'))
  .map((dirent) => dirent.name);

describe('the error parser', () => {
  test.each(examples)('parses %s', async (example) => {
    const file = join(examplesDir, example);
    const res = await readFile(file, 'utf8');
    const parsed = parseCurlResponse(res);
    console.log(parsed);
    const exp = JSON.parse(await readFile(`${file}.expected.json`, 'utf8'));
    expect(parsed).toEqual(exp);
  });
});
