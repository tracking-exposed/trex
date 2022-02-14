import { getExtensionConfig } from '../packages/shared/src/webpack/extension.config';
import pkgJson from './package.json';
import { AppEnv } from './src/AppEnv';

const manifestVersion = (
  process.env.MANIFEST_VERSION ?? pkgJson.version
).replace('-beta', '');

const { buildENV, ...config } = getExtensionConfig('ycai', {
  cwd: __dirname,
  env: AppEnv,
  manifestVersion,
  transformManifest: (manifest) => {
    if (config.mode === 'development') {
      manifest.permissions = [
        'http://localhost:9000/',
        ...manifest.permissions,
      ];
    }

    if (buildENV.BUNDLE_TARGET === 'chrome') {
      manifest.cross_origin_embedder_policy = {
        value: 'require-corp',
      };

      manifest.cross_origin_opener_policy = {
        value: 'same-origin',
      };
    }

    return manifest;
  },
});

export default config;
