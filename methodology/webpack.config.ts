import * as t from "io-ts";
import * as path from "path";
import { getConfig } from "../shared/src/webpack/config";

// process.env.VERSION = packageJson.version;

const { buildENV, ...config } = getConfig({
  cwd: __dirname,
  outputDir: path.resolve(__dirname, "build/desktop"),
  env: t.strict({}),
  hot: true,
  entry: {
    index: path.resolve(__dirname, "src/desktop/index.ts"),
  },
});

export default {
  ...config,
  devtool: "source-map",
  target: "electron-main",
};
