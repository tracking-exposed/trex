import supertest from "supertest";
import { makeApp } from "../bin/app";
import nconf from "nconf";
import debug from "debug";
import * as path from "path";

debug.enable(process.env.DEBUG ?? "");

const config = nconf
  .argv()
  .file({ file: path.resolve(__dirname, "../config/settings.json") })
  .env();

const logger = debug("yttrex").extend("test");

export interface Test {
  app: supertest.SuperTest<supertest.Test>;
  debug: debug.Debugger;
  config: any;
}

export const GetTest = async (): Promise<Test> => {
  config.set("mongoPort", 27019);
  config.set("mongoHost", "0.0.0.0");
  config.set("mongoDb", "test");
  config.set("key", "test-key");
  config.set("storage", "_test_htmls");

  const app = makeApp({ config: config.get() });

  return {
    app: supertest(app),
    debug: logger,
    config,
  };
};
