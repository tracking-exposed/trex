/* this script is inspired by
 * $ cp ../../../YCAI/src/components/dashboard/settings/Swagger.tsx bin/swagger-converter.js
 * and extend the API description based on a static list
 * imply the same keyname has the same description
 */

import endpoints from '../../packages/shared/src/endpoints/v3';
import models from '../../packages/shared/src/models';
import * as swagger from '../../packages/shared/src/providers/swagger/swagger.provider';
import * as fs from 'fs';
import * as path from 'path';
import packageJson from '../package.json';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { validate } = require('@apidevtools/swagger-cli');

const openDocAPI = swagger.generateDoc({
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
});

// print unvalidated open doc api
fs.writeFileSync(
  path.resolve(process.cwd(), 'docs/openapi.json'),
  JSON.stringify(openDocAPI, null, 2)
);

validate(openDocAPI, { schema: false, spec: true }, (err: any, api: any) => {
  if (err) {
    // eslint-disable-next-line
    console.log(err.toJSON());
    throw err;
  }
  fs.writeFileSync(
    path.resolve(process.cwd(), 'docs/openapi-validated.json'),
    JSON.stringify(api, null, 2)
  );
});
