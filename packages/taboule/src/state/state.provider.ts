import { GetTabouleCommands, TabouleCommands } from './commands';
import { GetTabouleQueries, TabouleQueries } from './queries';
/**
 * Taboule Data Provider
 *
 * @module state!TabouleDataProvider
 *
 * @param baseURL
 * @returns type safe queries and commands
 */
export const TabouleDataProvider = (
  baseURL: string
): { queries: TabouleQueries; commands: TabouleCommands } => {
  const queries = GetTabouleQueries({ baseURL });
  const commands = GetTabouleCommands({ baseURL }, queries);
  return { queries, commands };
};
