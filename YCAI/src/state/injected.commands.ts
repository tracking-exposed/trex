import { command } from 'avenger';

import { sendMessage } from '../providers/browser.provider';
import { OptInNudgeStatus } from '../models/Settings';
import { Messages } from '../models/Messages';
import { donationOptInNudgeStatus } from './injected.queries';

export const setDonationOptInNudgeStatus = command(
  (payload: OptInNudgeStatus) => sendMessage(Messages.SetDonationOptInNudgeStatus)(payload),
  { donationOptInNudgeStatus }
);
