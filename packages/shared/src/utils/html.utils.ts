/**
 * Strip all `\n` and `\t` from the given string.
 */
export const sanitizeHTML = (html: string): string =>
  html.replace(/(\n|\t) +/g, '');
