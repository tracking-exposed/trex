import * as endpoints from '@shared/endpoints';
import models from '@shared/models';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import SwaggerUI from 'swagger-ui';
import 'swagger-ui/dist/swagger-ui.css';
import { config } from '../../../config';
import * as swagger from '../../../providers/swagger/swagger.provider';
import '../../../resources/swagger-ui-material.css';

export const Swagger: React.FC = () => {
  const { t } = useTranslation();
  const ref = React.createRef<HTMLDivElement>();

  React.useEffect(() => {
    const swaggerConfig = swagger.generateDoc({
      title: t('common:title'),
      description: t('common:description'),
      version: config.VERSION,
      // TODO: this should come from the env
      server: {
        protocol: 'https',
        host: 'youchoose.tracking.exposed',
        port: 443,
        basePath: 'api',
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
