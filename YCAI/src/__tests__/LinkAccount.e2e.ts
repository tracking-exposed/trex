import { GetPupTest, PupTest } from '../test/PupTest';
import {
  SET_CHANNEL_STEP_ID,
  VERIFY_CHANNEL_BOX_ID,
  VERIFICATION_TOKEN_BOX_ID
} from '../components/dashboard/LinkAccount';

// todo: this should come from env
const TEST_CHANNEL = 'ryewgbd122wew1';

describe('LinkAccount flow', () => {
  let pup: PupTest;
  beforeAll(async () => {
    pup = await GetPupTest();
  });

  afterAll(async () => {
    await pup.browser.close();
  });

  jest.setTimeout(30 * 1000);

  test('Should failed when the verification token is not found in YT channel description', async () => {
    const page = await pup.browser.pages().then((p) => p[0]);
    // open the dashboard
    pup.logger.debug(`Navigate to %s`, pup.extensionDashboardURL);
    await page.goto(pup.extensionDashboardURL, { waitUntil: 'load' });

    pup.logger.debug(`Wait for selector %s`, `#${SET_CHANNEL_STEP_ID}`);
    await page.waitForSelector(`#${SET_CHANNEL_STEP_ID}`);
    pup.logger.debug(
      'Type channel %s in element %s',
      TEST_CHANNEL,
      `#${SET_CHANNEL_STEP_ID} input`
    );
    await page.type(`#${SET_CHANNEL_STEP_ID} input`, TEST_CHANNEL);
    pup.logger.debug(`Click %s button`, `#${SET_CHANNEL_STEP_ID} button`);
    await page.click(`#${SET_CHANNEL_STEP_ID} button`);
    pup.logger.debug(`Wait for verification code input`);
    await page.waitForSelector(`#${VERIFICATION_TOKEN_BOX_ID} p`);
    pup.logger.debug(`Click copy button`);
    await page.click(`#${VERIFICATION_TOKEN_BOX_ID} button`);
    pup.logger.debug(`Click verify button`);
    await page.click(`#${VERIFY_CHANNEL_BOX_ID} button`);
    pup.logger.debug(`Wait for error box`);
    await page.waitForSelector('.error-box');
  });
});
