import sharedModels from '@shared/models';
import * as contributorPersonalStats from '@shared/models/contributor/ContributorPersonalStats';
import * as contributorModels from '@shared/models/contributor/ContributorPersonalSummary';
import * as contributorPublicKey from '@shared/models/contributor/ContributorPublicKey';
import * as swagger from '@shared/providers/swagger/swagger.provider.node';
import * as path from 'path';
import * as endpoints from '../src/endpoints';
import * as apiModels from '../src/models';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package.json');

const models = {
  ...contributorPublicKey,
  ...contributorModels,
  ...contributorPersonalStats,
  ...sharedModels,
  ...apiModels,
};

swagger.writeOpenDocTo(
  {
    title: 'YT TrEx API Docs',
    description: 'Tracking exposed API documentation for youtube platform',
    server: {
      host: 'youtube.tracking.exposed',
      port: '' as any,
      protocol: 'https',
      basePath: 'api',
    },
    endpoints,
    version: packageJson.version,
    models,
    components: {
      security: {
        ACTToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Authorization',
        },
      },
    },
    security: [
      {
        ACTToken: [],
      },
    ],
  },
  path.resolve(process.cwd(), './build'),
  true
);
