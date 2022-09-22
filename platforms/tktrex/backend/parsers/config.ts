import nconf from 'nconf';

export interface TKParserConfig {
  downloads?: string;
}

export const tkParserConfig = {
  downloads: nconf.get('downloads'),
};
