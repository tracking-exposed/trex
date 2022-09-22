/**
 * Strip all `\n` and `\t` from the given string.
 */
export const sanitizeHTML = (html: string): string =>
  html.replace(/(\n|\t) +/g, '');

/**
 * ** REALLY OPINIONATED **
 * Strip all unnecessary chars from the given string.
 */
export const sanitizeTextContent = (html: string): string =>
  html.replace(/[&]nbsp[;]/gi, ' ').replace(/\u00a0/gi, ' ');
