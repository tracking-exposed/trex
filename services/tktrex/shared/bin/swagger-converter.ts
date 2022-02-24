/* this script is inspired by
 * $ cp ../../../YCAI/src/components/dashboard/settings/Swagger.tsx bin/swagger-converter.js
 * and extend the API description based on a static list
 * imply the same keyname has the same description
 */

import * as endpoints from '../src/endpoints';
import * as apiModels from '../src/models/api';
import * as swagger from '../../../../packages/shared/src/providers/swagger/swagger.provider';

const openDocAPI = swagger.generateDoc({
  title: 'Tktrex API Docs',
  description: 'Tracking exposed API documentation for tiktok platform',
  server: {
    host: 'tiktok.tracking.exposed',
    port: 443,
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

console.log(openDocAPI);

/*
import * as endpoints from '@shared/endpoints';
import models from '@shared/models';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import SwaggerUI from 'swagger-ui';
import 'swagger-ui/dist/swagger-ui.css';
import '../../../resources/swagger-ui-material.css';
import { config } from '../../../config';
import * as swagger from '../../../providers/swagger/swagger.provider';

export const Swagger: React.FC = () => {
  const { t } = useTranslation();
  const ref = React.createRef<HTMLDivElement>();

  React.useEffect(() => {
    const apiURL = new URL(config.API_URL);

    const swaggerConfig = swagger.generateDoc({
      title: t('swagger:title'),
      description: t('swagger:description'),
      version: config.VERSION,
      server: {
        protocol: apiURL.protocol === 'http:' ? 'http' : 'https',
        host: apiURL.hostname,
        port: parseInt(apiURL.port, 10),
        basePath: apiURL.pathname.slice(1),
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
        v1: endpoints.v1,
        v2: endpoints.v2,
        v3: endpoints.v3,
      },
      models: models,
    });

    SwaggerUI({
      domNode: ref.current,
      spec: swaggerConfig,
    });
  }, []);

  return <div ref={ref} />;
};
*/
