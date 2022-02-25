/* eslint-disable import/first */
jest.mock('puppeteer-core');
import * as puppeteer from 'puppeteer-core';

const puppeteerMock = puppeteer as jest.Mocked<typeof puppeteer>;

const pageMock = {
  on: jest.fn(),
  goto: jest.fn(),
  waitForTimeout: jest.fn().mockImplementation((ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms / 10);
    });
  }),
};
const browserMock = {
  pages: jest.fn().mockResolvedValue([pageMock] as any),
};
puppeteerMock.launch.mockResolvedValue(browserMock as any);

export { puppeteerMock, pageMock, browserMock };
