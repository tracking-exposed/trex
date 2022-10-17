import supertest from 'supertest';
import { makeApp } from '../bin/app';
import nconf from 'nconf';
import debug from 'debug';
import * as path from 'path';
import { MongoClient } from 'mongodb';
import * as mongo3 from '@shared/providers/mongo.provider';
import { GetLogger, Logger } from '@shared/logger';

debug.enable(process.env.DEBUG ?? '');

const logger = GetLogger('tktrex').extend('test');

export interface Test {
  app: supertest.SuperTest<supertest.Test>;
  logger: Logger;
  mongo3: typeof mongo3;
  mongo: MongoClient;
  config: nconf.Provider;
}

export const GetTest = async (): Promise<Test> => {
  const config = nconf
    .argv()
    .file({ file: path.resolve(__dirname, '../config/settings.json') })
    .env();

  config.set('mongoHost', '0.0.0.0');
  config.set('key', 'test-key');
  config.set('storage', '_test_htmls');
  config.set('mongoDb', 'tktrex-test');

  const mongo = await mongo3.clientConnect({});

  if (!mongo) {
    throw new Error('mongo3.clientConnect failed');
  }

  const app = await makeApp({ config: config.get(), mongo });

  return {
    app: supertest(app),
    logger,
    config,
    mongo,
    mongo3,
  };
};
