import * as endpoints from '@yttrex/shared/endpoints';
import models from '@shared/models';
import * as swagger from '@shared/providers/swagger/swagger.provider';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import SwaggerUI from 'swagger-ui';
import { config } from '../../../config';

import 'swagger-ui/dist/swagger-ui.css';
import '../../../resources/swagger-ui-material.css';

export const Swagger: React.FC = () => {
  const { t } = useTranslation();
  const ref = React.createRef<HTMLDivElement>();

  React.useEffect(() => {
    const apiURL = new URL(config.API_URL);

    const swaggerConfig = swagger.generateDoc(
      {
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
        models: models as any,
      },
      (e: any) => {
        if (typeof e.description === 'string') {
          return e.description;
        }
        return `${e.Method}: ${e.getStaticPath((a: any) => `:${a}`)}`;
      }
    );

    SwaggerUI({
      domNode: ref.current,
      spec: swaggerConfig,
    });
  }, []);

  return <div ref={ref} />;
};
