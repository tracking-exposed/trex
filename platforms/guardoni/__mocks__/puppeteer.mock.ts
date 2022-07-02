/* eslint-disable import/first */
jest.mock('puppeteer-extra');
import puppeteer, { PuppeteerExtra } from 'puppeteer-extra';

const puppeteerMock = puppeteer as jest.Mocked<PuppeteerExtra>;

const pageMock = {
  on: jest.fn(),
  goto: jest.fn(),
  waitForSelector: jest.fn().mockImplementation(() => {
    throw new Error(`waitForSelector: Not implemented`);
  }),
  $: jest.fn(),
  evaluate: jest.fn(),
  evaluateHandle: jest.fn(),
  waitForTimeout: jest.fn().mockImplementation((ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms / 10);
    });
  }),
};
const browserMock = {
  pages: jest.fn().mockResolvedValue([pageMock] as any),
};
puppeteerMock.use.mockImplementation((fn) => puppeteerMock);
puppeteerMock.launch.mockImplementation(() => {
  return Promise.resolve(browserMock) as any;
});

export { puppeteerMock, pageMock, browserMock };
