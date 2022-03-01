import * as endpoints from '../src/endpoints';
import * as apiModels from '../src/models/api';
import * as sharedModels from '../../../../packages/shared/src/models';
import * as swagger from '../../../../packages/shared/src/providers/swagger/swagger.provider.node';
import * as path from 'path';
import packageJson from '../package.json';

swagger.writeOpenDocTo(
  {
    title: 'Tktrex API Docs',
    description: 'Tracking exposed API documentation for tiktok platform',
    server: {
      host: 'tiktok.tracking.exposed',
      port: '' as any,
      protocol: 'https',
      basePath: 'api',
    },
    endpoints: {
      v1: endpoints,
    },
    version: packageJson.version,
    models: { ...apiModels, ...(sharedModels as any) },
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
);
