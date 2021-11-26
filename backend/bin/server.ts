#!/usr/bin/env node
import * as http from "http";
import _ from "lodash";
import debug from "debug";
import nconf from "nconf";
import dbutils from "../lib/dbutils";
import security from "../lib/security";
import { makeApp } from "./app";

const d = debug("yttrex");

const cfgFile = "config/settings.json";

nconf.argv().env().file({ file: cfgFile });

d("ઉ nconf loaded, using %s", cfgFile);

if (!nconf.get("interface") || !nconf.get("port"))
  throw new Error(
    "check your config/settings.json, config of 'interface' and 'post' missing"
  );

/* everything begin here, welcome */
/* create express app */
const app = makeApp({});
const server = new http.Server(app as any);
server.listen(nconf.get("port"), nconf.get("interface"), () => {
  d(` Listening on http://${nconf.get("interface")}:${nconf.get("port")}`);
});

async function initialSanityChecks() {
  /* security checks = is the password set and is not the default? (more checks might come) */
  security.checkKeyIsSet();
  await dbutils.checkMongoWorks(true /* if true means that failure is fatal */);
}

initialSanityChecks();
