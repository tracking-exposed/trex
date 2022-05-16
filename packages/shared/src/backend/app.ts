import { MongoClient } from 'mongodb';

export interface MakeAppContext {
  config: {
    port: number;
  };
  mongo: MongoClient;
}
