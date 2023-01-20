import { ParserConfiguration } from '@shared/providers/parser';
import nconf from 'nconf';

export interface YTParserConfig extends ParserConfiguration {
  downloads?: string;
}

export const parserConfig: YTParserConfig = {
  downloads: nconf.get('NO_DOWNLOAD'),
};
