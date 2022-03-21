import { CurlStatus } from './tikTokParser';
interface CurlResponse {
  statusLine: string;
  headers: Record<string, string>;
  body?: string;
}

export const parseCurlResponse = (res: string): CurlResponse[] | Error => {
  const blocks = res.split(/\r\n\r\n/);

  const headerBlocks = blocks.length > 1 ? blocks.slice(0, blocks.length - 1) : blocks;
  const body = blocks.length > 1 ? blocks[blocks.length - 1] : '';

  const parsedHeaderBlocks = headerBlocks.map((block): CurlResponse => {
    const [statusLine, ...preLines] = block.split(/\r\n/g);
    const lines = preLines.filter((line) => line.trim().length > 0);
    const headers = lines.reduce((acc, line) => {
      const [key, value] = line.split(': ');
      return { ...acc, [key.trim()]: value?.trim() };
    }, {});

    return { statusLine: statusLine.trim(), headers };
  });

  if (parsedHeaderBlocks.length > 0) {
    parsedHeaderBlocks[headerBlocks.length - 1].body = body.trim();
  }
  return parsedHeaderBlocks;
};

export const responseStatus = (resChunks: CurlResponse[]): CurlStatus => {
  for (const resChunk of resChunks) {
    const [, statusCode] = resChunk.statusLine.split(' ');
    if (resChunk.body?.includes('location.replace("https://block.opendns.com')) {
      return 'network error';
    }

    if (resChunk.body?.toLowerCase().includes('unavailable for legal reasons')) {
      return 'unavailable for legal reasons';
    }

    const expRedirect = /Redirecting to <a href="https:\/\/www\.tiktok.com\/[a-z]{2}\/notfound">/;
    if (expRedirect.test(resChunk.body ?? '')) {
      return 'country not found';
    }

    if (resChunks.length === 1) {
      let allLuminati = true;
      for (const [key, value] of Object.entries(resChunk.headers)) {
        const k = key.trim().toLowerCase();
        if (!k) {
          continue;
        }
        if (!k.startsWith('x-luminati-')) {
          allLuminati = false;
          break;
        }
      }
      if (allLuminati) {
        return 'proxy error';
      }
    }

    if (resChunk.headers.location?.startsWith('https://www.tiktok.com/login')) {
      return 'redirect to login';
    }

    if (statusCode === '403') {
      return 'network error';
    }

    if (statusCode === '401') {
      return 'network error';
    }

    if (resChunk.statusLine.includes('Proxy Error')) {
      return 'proxy error';
    }

    if (resChunk.statusLine.includes('Redirect')) {
      return 'network error';
    }

    if (resChunk.statusLine.includes('Could not resolve host')) {
      return 'network error';
    }
  }

  return 'success';
};
