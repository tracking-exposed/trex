import { pipe } from 'fp-ts/lib/function';
import { chain, map, right } from 'fp-ts/lib/TaskEither';
import { available, queryShallow } from 'avenger';

import { Messages } from '../models/Messages';
import { getInitialOptInNudgeStatus } from '../models/Settings';
import { sendMessage } from '../providers/browser.provider';

export const donationOptInNudgeStatus = queryShallow(
  () => pipe(
    sendMessage(Messages.GetDonationOptInNudgeStatus)(),
    chain((status) => {
      if (!status) {
        const initialStatus = getInitialOptInNudgeStatus();
        return pipe(
          sendMessage(Messages.SetDonationOptInNudgeStatus)(initialStatus),
          map(() => initialStatus)
        );
      }
      return right(status);
    }
    )
  ),
  available,
);
