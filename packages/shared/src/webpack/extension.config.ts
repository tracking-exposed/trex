import { getConfig, GetConfigParams, WebpackConfig } from './config';
import { CopyWebpackPlugin, FileManagerPlugin } from './plugins';
import * as path from 'path';
import * as t from 'io-ts';

interface GetExtensionConfigParams<E extends t.Props>
  extends Omit<GetConfigParams<E>, 'target' | 'hot' | 'outputDir' | 'entry'> {
  distDir: string;
  target?: WebpackConfig['target'];
  entry?: Record<string, string>;
  outputDir?: string;
  manifestVersion: string;
  transformManifest: (m: any) => any;
}

const getExtensionConfig = <E extends t.Props>(
  extensionName: string,
  c: GetExtensionConfigParams<E>
): WebpackConfig => {
  process.env.VERSION = c.manifestVersion;

  const outputDir = c.outputDir ?? path.resolve(c.cwd, 'build/extension');
  const distDir = c.distDir ?? path.resolve(c.cwd, 'dist/extension');

  const { buildENV, ...config } = getConfig({
    target: 'web',
    outputDir,
    entry: {
      ext: path.resolve(c.cwd, 'src/app.tsx'),
      popup: path.resolve(c.cwd, 'src/popup.tsx'),
      background: path.resolve(c.cwd, 'src/background/index.ts'),
    },
    ...c,
    hot: false,
  });

  config.devtool = config.mode === 'development' ? 'inline-source-map' : false;

  config.plugins.push(
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(c.cwd, 'public'),
          filter: (file: string) => {
            const { base } = path.parse(file);
            return !['manifest.json', 'index.html'].includes(base);
          },
        },
        {
          from: path.resolve(c.cwd, 'public/manifest.json'),
          transform: (content: Buffer) => {
            const manifest = JSON.parse(content.toString());
            manifest.version = c.manifestVersion;
            const manifestJSON = JSON.stringify(
              c.transformManifest(manifest),
              null,
              2
            );
            return manifestJSON;
          },
        },
      ],
    })
  );

  config.plugins.push(
    new FileManagerPlugin({
      events: {
        onEnd: {
          archive: [
            {
              source: outputDir,
              destination: path.resolve(
                config.mode === 'production' ? distDir : outputDir,
                `./${extensionName}-extension-${c.manifestVersion}.zip`
              ),
              options: {
                globOptions: {
                  ignore: ['*.zip'],
                },
              },
            },
          ],
        },
      },
    })
  );

  return { buildENV, ...config };
};

export { getExtensionConfig };
