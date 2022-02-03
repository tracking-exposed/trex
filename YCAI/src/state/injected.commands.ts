import { command } from 'avenger';
import { browser, Messages } from '../providers/browser.provider';
import { OptInNudgeStatus } from '../models/Settings';
import { donationOptInNudgeStatus } from './injected.queries';

export const setDonationOptInNudgeStatus = command(
  (payload: OptInNudgeStatus) =>
    browser.sendMessage(Messages.SetDonationOptInNudgeStatus)(payload),
  { donationOptInNudgeStatus }
);
