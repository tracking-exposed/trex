import { readdirSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { parseCurlResponse, responseStatus } from '../src/util';

describe('the parseCurlResponse util', () => {
  const src = `HTTP/1.1 200 OK
  x-luminati-ip: r2d29b70ff204425f8e5add587d860361
  x-luminati-timeline: z8287-init:0,auth:83,dns_resolve:0,p2p_init:105,p2p_conn:700
  x-luminati-tun-timeline: init:0,connect:280`
    .split('\n')
    .map((line) => line.trim())
    .join('\r\n');

  it('parses a minimal response', () => {
    expect(parseCurlResponse(src)).toEqual([{
      statusLine: 'HTTP/1.1 200 OK',
      headers: {
        'x-luminati-ip': 'r2d29b70ff204425f8e5add587d860361',
        'x-luminati-timeline': 'z8287-init:0,auth:83,dns_resolve:0,p2p_init:105,p2p_conn:700',
        'x-luminati-tun-timeline': 'init:0,connect:280',
      },
      body: '',
    }]);
  });

  it('parses a more complex response', async () => {
    const response = await readFile(
      join(__dirname, 'fixtures/tto-error-from-curl/1646285388964'),
      'utf8',
    );
    const responses = parseCurlResponse(response);
    if (responses instanceof Error) {
      throw responses;
    }

    expect(responses[responses.length - 1].body).toEqual('Unavailable For Legal Reasons');
  })
});

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
    const exp = JSON.parse(await readFile(`${file}.expected.json`, 'utf8'));
    if (parsed instanceof Error) {
      throw parsed;
    }
    expect(responseStatus(parsed)).toEqual(exp);
  });
});
