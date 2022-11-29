import { trexLogger } from '../../logger';
import _ from 'lodash';

const logger = trexLogger.extend('html-size');

/**
 *
 */

function isAboveMinimum(curr: number): boolean {
  // this is the minimum size worthy of reporting
  if (curr < 100000) {
    logger.debug('HTML too small to consider!', curr);
    return false;
  }
  return true;
}

/**
 *
 */

function getPercentageIncrease(prev: number, curr: number): number {
  // check if the increment is more than 4%, otherwise is not interesting
  const percentile = 100 / curr;
  const percentage = _.round(100 - percentile * prev, 2);
  logger.debug('Increased by % %s', percentage);
  return percentage;
}

/**
 * Check html size
 *
 * @param nodeHTML html string to send as contribution
 * @returns true when html increased since last time
 */
export function sizeCheck(prev: number, curr: number): boolean {
  // this is the minimum size worthy of reporting
  if (!isAboveMinimum(curr)) {
    logger.debug('HTML too small to consider!', curr);
    return false;
  }

  // check if the increment is more than 4%, otherwise is not interesting
  const percentage = getPercentageIncrease(prev, curr);

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
  getPercentageIncrease: (html: string) => number;
  hasNewContent: (html: string) => boolean;
  reset: () => void;
}

export const HTMLSize = (): HTMLSize => {
  let lastSize = 1;
  return {
    getPercentageIncrease: (html) => {
      return getPercentageIncrease(lastSize, html.length);
    },
    hasNewContent: (html) => {
      // this function look at the LENGTH of the proposed element.
      // this is used in video because the full html body page would be too big.
      const s = html.length;
      if (!sizeCheck(lastSize, s)) {
        logger.debug('HTML has not changed: %d (%d)', lastSize, s);
        return false;
      }
      logger.debug('HTML has changed from %d to %d', lastSize, s);
      lastSize = s;

      return true;
    },
    reset: () => {
      lastSize = 1;
    },
  };
};
