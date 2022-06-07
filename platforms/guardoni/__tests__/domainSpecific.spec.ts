import subSeconds from 'date-fns/subSeconds';
import {
  getMaybeScreenshotFilename,
  getScreenshotName,
} from '../src/guardoni/directives/yt.directives';

describe('Domain specific API', () => {
  describe('Screenshot path', () => {
    it('succeeds with undefined when last screenshot < 5s ago', () => {
      const lastScreenTime = subSeconds(new Date(), 3);
      expect(getMaybeScreenshotFilename(lastScreenTime)).toBe(null);
    });

    it('succeeds with screenshot file name', () => {
      const lastScreenTime = subSeconds(new Date(), 6);
      const screenshotName = getScreenshotName('null');
      const maybeScreenshotName = getMaybeScreenshotFilename(lastScreenTime);
      expect(maybeScreenshotName?.startsWith(screenshotName)).toBe(true);
    });
  });
});
