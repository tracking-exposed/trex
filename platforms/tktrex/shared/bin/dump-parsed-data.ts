import path from 'path';
import { writeFile } from 'fs/promises';
import yargs from 'yargs/yargs';
import { MongoClient } from 'mongodb';

/* eslint-disable no-console */

/**
 * The purpose of this script is to gather a bunch of parsed data from the
 * database to serve as test fixtures for the parser.
 */

const dbName = 'tktrex';

const dumpParsedData = async(
  dbHost: string,
  dbPort: number,
  target: string,
): Promise<void> => {
  console.log('connecting to', { dbHost, dbPort });
  const connectionURL = `mongodb://${dbHost}:${dbPort}`;
  const client = new MongoClient(connectionURL);
  await client.connect();

  const db = client.db(dbName);
  console.log(`connected to db "${dbName}"`);

  const htmlsCollection = db.collection('htmls');
  const parsed = (await htmlsCollection.aggregate([
    {
      $lookup: {
        from: 'metadata',
        localField: 'id',
        foreignField: 'id',
        as: 'metadata',
      },
    }, {
      $match: {
        metadata: {
          $exists: true,
          $ne: [],
          $size: 1,
        },
      },
    },
  ]).toArray()).map(({ metadata: [meta], ...rest }) => ({
    ...rest,
    metadata: meta,
  }));

  console.log(`found ${parsed.length} parsed documents`);
  console.log(`dumping the parsed data to "${target}"`);

  await writeFile(target, JSON.stringify(parsed, null, 2));

  await client.close();
};

yargs(process.argv)
  .command(
    ['dump', '$0'],
    'dump parsed data from the database',
    (args) =>
      args.option('dbPort', {
        alias: 'p',
        type: 'number',
        description: 'Database server port',
        default: 27017,
      }).option('dbHost', {
        alias: 'h',
        type: 'string',
        description: 'Database server host',
        default: 'localhost',
      }).option('target', {
        alias: 't',
        type: 'string',
        description: 'Target JSON file to write to',
        default: path.resolve(__dirname, '../__spec__/parser/fixtures/history.json'),
      }),
    (argv) => {
      dumpParsedData(argv.dbHost, argv.dbPort, argv.target)
        .catch(console.error);
    },
  )
  .help()
  .parse();
