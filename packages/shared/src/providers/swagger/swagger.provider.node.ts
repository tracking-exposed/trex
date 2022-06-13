/**
 * Swagger provider
 *
 * Generate Swagger configuration from our endpoints definition
 *
 * Here is a the OpenAPI Specs used by swagger
 *
 * https://swagger.io/docs/specification/about/
 */

import * as fs from 'fs';
import * as path from 'path';
import { MinimalEndpointInstance } from '../../endpoints';
import { generateDoc, DocConfig } from './swagger.provider';
import { swaggerLogger } from './utils';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { validate } = require('@apidevtools/swagger-cli');

const getDocumentation = (e: MinimalEndpointInstance): string => {
  swaggerLogger.debug('Getting documentation for endpoint %O', e);
  const hasDocumentationMethod = (e as any).description !== undefined;
  if (hasDocumentationMethod) {
    if ((e as any).description.path) {
      return fs.readFileSync((e as any).description.path, 'utf-8');
    }
  }
  return `${e.Method}: ${e.getStaticPath((a) => `:${a}`)}`;
};

export const writeOpenDocTo = (
  config: DocConfig,
  to: string,
  v?: boolean
): void => {
  const openDocAPI = generateDoc(config, getDocumentation);

  // swaggerLogger.debug('Open doc api %O', openDocAPI)

  fs.mkdirSync(to, { recursive: true });
  // this file is unused, but is needed to see what
  // comes from generateDoc
  fs.writeFileSync(
    path.resolve(to, 'open-api-unchecked.json'),
    JSON.stringify(openDocAPI, null, 2)
  );

  if (v) {
    validate(
      openDocAPI,
      { schema: false, spec: true },
      (err: any, api: any) => {
        if (err) {
          const jsonError = err.toJSON();
          swaggerLogger.error(`Error %s: %O`, jsonError.name, jsonError);
          throw err;
        }

        const openDocAPIJson = JSON.stringify(api, null, 2);
        swaggerLogger.debug('Open doc api %O', openDocAPIJson);
        fs.writeFileSync(path.resolve(to, 'open-api.json'), openDocAPIJson);
      }
    );
  } else {
    fs.writeFileSync(
      path.resolve(to, 'open-api.json'),
      JSON.stringify(openDocAPI, null, 2)
    );
  }
};
