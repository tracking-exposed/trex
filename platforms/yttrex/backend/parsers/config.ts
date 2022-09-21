import nconf from 'nconf';

export interface YTParserConfig {
  downloads?: string;
}

export const parserConfig = {
  downloads: nconf.get('NO_DOWNLOAD'),
};
