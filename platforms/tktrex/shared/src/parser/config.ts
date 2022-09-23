import { ParserConfiguration } from '@shared/providers/parser.provider';

/**
 * The TK Parser configuration interface
 */
export interface TKParserConfig extends ParserConfiguration {
  /**
   * An optional folder used to store downloads
   */
  downloads?: string;
}
