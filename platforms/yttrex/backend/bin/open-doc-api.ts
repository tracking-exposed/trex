import * as endpoints from '../../../../packages/shared/src/endpoints';
import * as contributorModels from '../../../../packages/shared/src/models/contributor/ContributorPersonalSummary';
import * as contributorPersonalStats from '../../../../packages/shared/src/models/contributor/ContributorPersonalStats';
import * as contributorPublicKey from '../../../../packages/shared/src/models/contributor/ContributorPublicKey';
import sharedModels from '../../../../packages/shared/src/models';
import * as apiModels from '../models';
import * as swagger from '../../../../packages/shared/src/providers/swagger/swagger.provider.node';
import * as path from 'path';
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
