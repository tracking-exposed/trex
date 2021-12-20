import path from "path";
import { getConfig } from "../../shared/src/webpack/config";
import { CopyWebpackPlugin } from "../../shared/src/webpack/plugins";
import packageJson from "./package.json";
import * as t from "io-ts";

process.env.VERSION = packageJson.version;

const { buildENV, ...config } = getConfig({
  cwd: __dirname,
  outputDir: path.resolve(__dirname, "build"),
  env: t.strict({}),
  hot: true,
  entry: {
    taboule: path.resolve(__dirname, "src/index.tsx"),
  },
});

config.plugins.push(
  new CopyWebpackPlugin({
    patterns: [
      {
        from: "public",
      },
    ],
  })
);

export default {
  ...config,
  devtool: "source-map",
  output: {
    ...config.output,
    library: {
      name: "Taboule",
      type: "window",
      export: ["default"],
    },
  },
  devServer: {
    host: "0.0.0.0",
    port: 3002,
    hot: true,
  },
};
