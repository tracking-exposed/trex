import * as t from "io-ts";
import * as path from "path";
import { getConfig } from "../shared/src/webpack/config";
import { CopyWebpackPlugin } from "../shared/src/webpack/plugins";
// import packageJson from './package.json';

// process.env.VERSION = packageJson.version;

const { buildENV, ...config } = getConfig({
  cwd: __dirname,
  outputDir: path.resolve(__dirname, "build/desktop"),
  env: t.strict({}),
  hot: true,
  entry: {
    renderer: path.resolve(__dirname, "src/desktop/renderer.tsx"),
  },
});

config.plugins.push(
  new CopyWebpackPlugin({
    patterns: [
      {
        from: "static",
        filter: (file: string) => {
          const { base } = path.parse(file);
          return ["guardoni.html"].includes(base);
        },
      },
    ],
  })
);

export default {
  ...config,
  devtool: "source-map",
  target: "web",
  resolve: {
    ...config.resolve,
    fallback: {
      path: false,
      fs: false,
    },
  },
};
