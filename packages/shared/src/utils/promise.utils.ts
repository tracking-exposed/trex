/**
 * Wrap setTimeout in a promise for async timeout
 *
 * @param ms the time to sleep in milliseconds
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
