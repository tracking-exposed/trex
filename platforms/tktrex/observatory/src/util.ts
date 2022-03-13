interface CurlResponse {
  headers: Record<string, string>;
  body?: string;
}

export const parseCurlResponse = (res: string): CurlResponse[] => {
  const blocks = res.split('\n\n');
  const isBody = (line: string): boolean => line
    .trimStart()
    .match(/^<\w+>/) ? true : false;

  const headerBlocks = blocks.filter((b) => !isBody(b));
  const body = ([] as string[])
    .concat(blocks.filter(isBody))
    .reduce((acc, b) => `${acc}\n${b}`, '');

  const parsedHeaderBlocks = headerBlocks.map((block): CurlResponse => {
    const lines = block.split('\n');
    const headers = lines.reduce((acc, line) => {
      const [key, value] = line.split(': ');
      return { ...acc, [key]: value?.trim() };
    }, {});

    return { headers };
  });

  parsedHeaderBlocks[headerBlocks.length - 1].body = body;
  return parsedHeaderBlocks;
};
