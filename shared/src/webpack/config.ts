import DotenvPlugin from "dotenv-webpack";
import { pipe } from "fp-ts/lib/function";
import * as R from "fp-ts/lib/Record";
import * as S from "fp-ts/lib/string";
import * as t from "io-ts";
import { BooleanFromString } from "io-ts-types/lib/BooleanFromString";
import { PathReporter } from "io-ts/lib/PathReporter";
import path from "path";
import ReactRefreshTypescript from "react-refresh-typescript";
import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";
import webpack from "webpack";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import { GetLogger } from "../logger";



const webpackLogger = GetLogger("webpack");

// TODO: babel, browserlist, auto-prefixing, ...?

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

type BUILD_ENV = t.TypeOf<typeof BUILD_ENV>;
interface WebpackConfig extends webpack.Configuration {
  buildENV: BUILD_ENV;
  plugins: any[]; //webpack.WebpackPluginInstance[]
}

interface GetConfigParams<E extends t.Props> {
  cwd: string;
  outputDir: string;
  env: t.ExactC<t.TypeC<E>>;
  entry: {
    [key: string]: string;
  };
}

const getConfig = <E extends t.Props>(
  opts: GetConfigParams<E>
): WebpackConfig => {
  const mode =
    process.env.NODE_ENV === "production" ? "production" : "development";

  const DOTENV_CONFIG_PATH =
    process.env.DOTENV_CONFIG_PATH ??
    path.resolve(opts.cwd, mode === "production" ? ".env.production" : ".env");

  webpackLogger.debug(`DOTENV_CONFIG_PATH %s`, DOTENV_CONFIG_PATH);

  require("dotenv").config({ path: DOTENV_CONFIG_PATH });

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

  const appEnv = pipe(
    {
      ...process.env,
      NODE_ENV: mode,
      BUILD_DATE: new Date().toISOString(),
    },
    opts.env.decode,
    (validation) => {
      if (validation._tag === "Left") {
        webpackLogger.error(
          `Validation error for build end: %O`,
          PathReporter.report(validation).join("\n")
        );
        throw new Error(`${opts.env.name} decoding failed.`);
      }
      return validation.right;
    }
  );

  const stringifiedAppEnv = pipe(
    appEnv as any,
    R.reduceWithIndex(S.Ord)(
      {
        "process.env.NODE_ENV": JSON.stringify(mode),
      },
      (key, acc, v) => {
        // this is cause DefinePlugin to complain when we override
        // process.env vars
        // (process.env as any)[key] = v;
        return {
          ...acc,
          [`process.env.${key}`]: JSON.stringify(v),
        };
      }
    )
  );

  console.log(stringifiedAppEnv, process.env.DEBUG);

  const plugins: any[] = [
    new DotenvPlugin({
      path: DOTENV_CONFIG_PATH,
      silent: true,
    }),
    new webpack.DefinePlugin(stringifiedAppEnv as any),
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
                getCustomTransformers: () => ({
                  before: [mode === 'development' && ReactRefreshTypescript()].filter(
                    Boolean
                  ),
                }),
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

    resolve: {
      extensions: [".ts", ".tsx", ".js"],
      plugins: [
        new TsconfigPathsPlugin({
          configFile: path.resolve(opts.cwd, "./tsconfig.json"),
        }),
      ],
    },

    plugins,
    // custom options
    buildENV,
  };
};

export { getConfig };
