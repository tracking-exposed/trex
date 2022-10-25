import { trexLogger } from '../../logger';
import * as _ from 'lodash';

const logger = trexLogger.extend('html-size');

/**
 * Check html size
 *
 * @param nodeHTML html string to send as contribution
 * @returns true when html increased since last time
 */
export function sizeCheck(prev: number, curr: number): boolean {
  // this is the minimum size worthy of reporting
  if (curr < 100000) {
    logger.debug('HTML too small to consider!', curr);
    return false;
  }

  // check if the increment is more than 4%, otherwise is not interesting
  const percentile = 100 / curr;
  const percentage = _.round(100 - percentile * prev, 2);

  if (percentage < 5) {
    logger.debug(
      `Skipping update as ${percentage}% of the page is already sent (curr ${curr}, prev ${prev}) ${window.location.pathname}`
    );
    return false;
  }

  logger.info(
    `Valid update as a new %d% of the page have been received (curr %d, prev %d) %s`,
    percentage,
    curr,
    prev,
    window.location.pathname
  );
  return true;
}

export interface HTMLSize {
  check: (html: string) => boolean;
  reset: () => void;
}

export const HTMLSize = (): HTMLSize => {
  let lastSize = 1;
  return {
    check: (html) => {
      // this function look at the LENGTH of the proposed element.
      // this is used in video because the full html body page would be too big.
      const s = html.length;
      if (!sizeCheck(lastSize, s)) {
        return false;
      }
      lastSize = s;
      return true;
    },
    reset: () => {
      lastSize = 1;
    },
  };
};
