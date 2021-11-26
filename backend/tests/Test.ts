import supertest from "supertest";
import { makeApp } from "../bin/app";
import nconf from "nconf";
import debug from "debug";
import * as mongoMock from "../lib/__mocks__/mongo3";

debug.enable(process.env.DEBUG ?? "");
const config = nconf.argv().env().file({ file: "../config/settings.json" });

const logger = debug("yttrex").extend("test");

export interface Test {
  app: supertest.SuperTest<supertest.Test>;
  debug: debug.Debugger;
  config: any;
  mocks: {
    lib: {
      mongo3: typeof mongoMock;
    };
  };
}

export const GetTest = (): Test => {
  config.set("mongoPort", 27019);
  config.set("key", "test-key");
  config.set("storage", "_test_htmls");

  const app = makeApp(config);

  return {
    app: supertest(app),
    debug: logger,
    config,
    mocks: {
      lib: {
        mongo3: mongoMock,
      },
    },
  };
};
