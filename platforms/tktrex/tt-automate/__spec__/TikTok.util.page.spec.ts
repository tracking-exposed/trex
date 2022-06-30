import { getAssetPath } from '@platform/TikTok/util/project';
import { fileExists } from '@util/fs';

describe.skip('the "getAssetPath" method for TikTok', () => {
  it('should find an asset', async(): Promise<void> => {
    const path = getAssetPath('tktrex-extension-0.2.6.zip');
    const exists = await fileExists(path);
    expect(exists).toBe(true);
  });
});
