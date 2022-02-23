/* this script is inspired by
 * $ cp ../../../YCAI/src/components/dashboard/settings/Swagger.tsx bin/swagger-converter.js
 * and extend the API description based on a static list
 * imply the same keyname has the same description
 */

import * as endpoints from '../src/endpoints';
import * as apiModels from '../src/models/api';
import * as swagger from '../../../../packages/shared/src/providers/swagger/swagger.provider';
import * as fs from 'fs';
import * as path from 'path';
const { validate } = require('@apidevtools/swagger-cli');

const openDocAPI = swagger.generateDoc({
  title: 'Tktrex API Docs',
  description: 'Tracking exposed API documentation for tiktok platform',
  server: {
    host: 'tiktok.tracking.exposed',
    port: '443' as any,
    protocol: 'https',
    basePath: 'api',
  },
  endpoints: {
    v1: endpoints,
  },
  version: '1',
  models: apiModels,
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
});

// print unvalidated open doc api
// fs.writeFileSync(
//   path.resolve(process.cwd(), 'build/openapi-tktrex.json'),
//   JSON.stringify(openDocAPI, null, 2)
// );

validate(openDocAPI, {}, (err: any, api: any) => {
  if (err) {
    // eslint-disable-next-line
    console.log(JSON.stringify(err.details, null, 2));
    throw err;
  }
  fs.writeFileSync(
    path.resolve(process.cwd(), 'build/openapi-tktrex-validated.json'),
    JSON.stringify(api, null, 2)
  );
});
