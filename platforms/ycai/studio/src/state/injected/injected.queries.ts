import { pipe } from 'fp-ts/lib/function';
import { chain, map, right } from 'fp-ts/lib/TaskEither';
import { available, queryShallow } from 'avenger';

import { getInitialOptInNudgeStatus } from '../../models/Settings';
import { browser, Messages } from '../../providers/browser.provider';

export const donationOptInNudgeStatus = queryShallow(
  () =>
    pipe(
      browser.sendMessage(Messages.GetDonationOptInNudgeStatus)(),
      chain((status) => {
        if (!status) {
          const initialStatus = getInitialOptInNudgeStatus();
          return pipe(
            browser.sendMessage(Messages.SetDonationOptInNudgeStatus)(
              initialStatus
            ),
            map(() => initialStatus)
          );
        }
        return right(status);
      })
    ),
  available
);
