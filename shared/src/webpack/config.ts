import path from "path";

import * as t from "io-ts";
import { pipe } from "fp-ts/lib/function";
import { PathReporter } from "io-ts/lib/PathReporter";
import { BooleanFromString } from "io-ts-types/lib/BooleanFromString";

import { DefinePlugin } from "webpack";
import CopyWebpackPlugin from "copy-webpack-plugin";
import DotenvPlugin from "dotenv-webpack";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";

import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";
import * as R from "fp-ts/lib/Record";
import { GetLogger } from "../logger";
import { string } from "fp-ts";

const webpackLogger = GetLogger("webpack");

// TODO: babel, browserlist, auto-prefixing, ...?

interface GetConfigParams<A extends Record<string, t.Mixed>> {
  cwd: string;
  outputDir: string;
  env: t.Type<A, unknown, unknown>;
  entry: {
    [key: string]: string;
  }
}

const getConfig = <A extends Record<string, t.Mixed>>(
  opts: GetConfigParams<A>
) => {
  const mode =
    process.env.NODE_ENV === "production" ? "production" : "development";

  const DOTENV_CONFIG_PATH =
    process.env.DOTENV_CONFIG_PATH ??
    path.resolve(opts.cwd, mode === "production" ? ".env.production" : ".env");

  webpackLogger.debug(`DOTENV_CONFIG_PATH %s`, DOTENV_CONFIG_PATH);

  require("dotenv").config({ path: DOTENV_CONFIG_PATH });

  const NODE_ENV = t.union(
    [t.literal("development"), t.literal("test"), t.literal("production")],
    "NODE_ENV"
  );

  const BUILD_ENV = t.strict(
    {
      NODE_ENV,
      BUNDLE_TARGET: t.union([t.literal("firefox"), t.literal("chrome")]),
      BUNDLE_STATS: BooleanFromString,
    },
    "processENV"
  );

  const buildENV = pipe(
    {
      BUNDLE_TARGET: "chrome",
      BUNDLE_STATS: "false",
      NODE_ENV: mode,
      ...process.env,
    },
    BUILD_ENV.decode,
    (validation) => {
      if (validation._tag === "Left") {
        console.error(PathReporter.report(validation).join("\n"));
        console.log("\n");
        throw new Error("process.env decoding failed.");
      }
      return validation.right;
    }
  );

  const appEnv = pipe(process.env, opts.env.decode, (validation) => {
    if (validation._tag === "Left") {
      webpackLogger.error(
        `Validation error for build end: %O`,
        PathReporter.report(validation).join("\n")
      );
      throw new Error(`${opts.env.name} decoding failed.`);
    }
    return validation.right;
  });

  const pkgJson = require(path.resolve(opts.cwd, "./package.json"));
  const manifestVersion = (
    process.env.MANIFEST_VERSION || pkgJson.version
  ).replace("-beta", "");

  const stringifiedAppEnv = pipe(
    appEnv,
    R.reduceWithIndex(
      {
        "process.env.BUILD_DATE": JSON.stringify(new Date().toISOString()),
        "process.env.VERSION": JSON.stringify(manifestVersion),
        "process.env.NODE_ENV": JSON.stringify(mode),
      },
      (key, acc, v) => ({
        ...acc,
        [`process.env.${key}`]: JSON.stringify(v),
      })
    )
  );

  const plugins = [
    new DefinePlugin(stringifiedAppEnv as any),

    new DotenvPlugin({
      path: DOTENV_CONFIG_PATH,
    }),

    new CopyWebpackPlugin({
      patterns: [
        {
          from: "public",
          filter: (file: string) => {
            const { base } = path.parse(file);

            if (base === "manifest.json") {
              return false;
            }

            return true;
          },
        },
        {
          from: "public/manifest.json",
          transform: (content: Buffer) => {
            const manifest = JSON.parse(content.toString());

            if (buildENV.BUNDLE_TARGET === "chrome") {
              manifest.cross_origin_embedder_policy = {
                value: "require-corp",
              };

              manifest.cross_origin_opener_policy = {
                value: "same-origin",
              };
            }

            manifest.version = manifestVersion;

            return JSON.stringify(manifest, null, 2);
          },
        },
      ],
    }),
  ];

  if (buildENV.BUNDLE_STATS) {
    plugins.push(
      new BundleAnalyzerPlugin({
        generateStatsFile: true,
        analyzerMode: "json",
      })
    );
  }

  return {
    mode,

    entry: opts.entry,

    output: {
      path: opts.outputDir,
      filename: "[name].js",
    },

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: "ts-loader",
              options: {
                compilerOptions: {
                  noEmit: false,
                  sourceMap: true,
                },
                transpileOnly: true,
              },
            },
          ],
        },
        {
          test: /\.(ttf|svg)$/,
          type: "asset/inline",
        },
        {
          test: /\.css$/,
          use: [
            {
              loader: "style-loader",
            },
            {
              loader: "css-loader",
            },
          ],
        },
      ],
    },

    devtool: mode === "development" ? "inline-source-map" : false,

    resolve: {
      extensions: [".ts", ".tsx", ".js"],
      plugins: [
        new TsconfigPathsPlugin({
          configFile: path.resolve(opts.cwd, "./tsconfig.json"),
        }),
      ],
    },

    plugins,
  };
};

export { getConfig };
