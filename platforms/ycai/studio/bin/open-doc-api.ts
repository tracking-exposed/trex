/* this script is inspired by
 * $ cp ../../../YCAI/src/components/dashboard/settings/Swagger.tsx bin/swagger-converter.js
 * and extend the API description based on a static list
 * imply the same keyname has the same description
 */

import models from '@shared/models';
import * as swagger from '@shared/providers/swagger/swagger.provider.node';
import endpoints from '@yttrex/shared/endpoints/v3';
import * as path from 'path';
import packageJson from '../package.json';

swagger.writeOpenDocTo(
  {
    title: 'youchoose ai',
    description: 'youchoose api description',
    version: packageJson.version,
    server: {
      protocol: 'https',
      host: 'api.youchoose.ai',
      port: '443' as any,
      basePath: '',
    },
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
    endpoints: {
      v3: endpoints,
    },
    models: models as any,
  },
  path.resolve(__dirname, '../build')
);
