import { trexLogger } from '@shared/logger';
import { formatDistance } from 'date-fns';
import differenceInMinutes from 'date-fns/differenceInMinutes';
import subMinutes from 'date-fns/subMinutes';
import { JSDOM } from 'jsdom';
import _ from 'lodash';
import { MongoClient } from 'mongodb';
import nconf from 'nconf';
import { HTML } from '../models/HTML';
import { Metadata } from '../models/Metadata';
import { Supporter } from '../models/Supporter';
import mongo3 from './mongo3';

const parserLog = trexLogger.extend('parser');
const overflowLog = parserLog.extend('overflow');

const FREQUENCY = 2;
const AMOUNT_DEFAULT = 20;
// By default the pipeline will start from "1 minute ago"
const BACKINTIMEDEFAULT = 1;

/* this sequence is executed in this order.
 * after the newline there are modules that levegared on previously mined metadata */

let nodatacounter = 0;
let processedCounter = 0;
const stats: {
  currentamount: number;
  current: Date | null;
} = { currentamount: 0, current: null };

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function buildMetadata(entry): Metadata | null {
  parserLog.debug('Metadata from %O', entry);
  // this contains the original .source (html, impression, timeline), the .findings and .failures
  // the metadata is aggregated by unit and not unrolled in any way
  if (!entry.findings?.nature) return null;

  if (entry.findings.nature.type === 'search') {
    const metadata = {
      ...entry.findings.nature,
      ...entry.findings.downloader,
      ...entry.findings.search,
    };
    metadata.savingTime = new Date(entry.source.html.savingTime);
    metadata.id = entry.source.html.id;
    metadata.publicKey = entry.source.html.publicKey;
    return metadata;
  }

  /* else ... */
  const metadata = {
    ...entry.findings.nature,
    ...entry.findings.description,
    ...entry.findings.music,
    ...entry.findings.hashtags,
    ...entry.findings.numbers,
    ...entry.findings.stitch,
    ...entry.findings.author,
    ...entry.findings.downloader,
  };

  metadata.savingTime = new Date(entry.source.html.savingTime);
  metadata.id = entry.source.html.id;
  metadata.publicKey = entry.source.html.publicKey;
  metadata.timelineId = entry.source.html.timelineId;
  metadata.order = entry.source.html.n[0];
  // from routes/events.js the 0 is videoCounter, client side
  return metadata;
}

interface Source {
  html: HTML;
}

interface LastHTMLs {
  overflow: boolean;
  sources: Source[];
  errors: number;
}

export const getLastHTMLs =
  ({ db }: ParserProviderContext) =>
  async (filter: any, amount: number): Promise<LastHTMLs> => {
    const htmls: Array<
      HTML & {
        supporter: Supporter[];
      }
    > = await db.api.aggregate(db.read, nconf.get('schema').htmls, [
      { $match: filter },
      { $sort: { savingTime: 1 } },
      { $limit: amount },
      {
        $lookup: {
          from: 'supporters',
          localField: 'publicKey',
          foreignField: 'publicKey',
          as: 'supporter',
        },
      },
    ]);

    let errors = 0;
    const formatted = _.map(htmls, function (h) {
      try {
        return {
          supporter: _.first(h.supporter),
          jsdom: new JSDOM(h.html.replace(/\n +/g, '')).window.document,
          html: _.omit(h, ['supporter']),
        };
      } catch (error) {
        errors++;
        parserLog.error(
          'Error when formatting HTML: %s, htmlId %s',
          error.message,
          h.id
        );
      }
      return undefined;
    });

    return {
      overflow: _.size(htmls) === amount,
      sources: _.compact(formatted) as any,
      errors,
    };
  };

export async function wrapDissector(
  dissectorF: (envelope: any, findings: any) => Promise<any>,
  dissectorName: string,
  source: any,
  envelope: PipelineResults
): Promise<any> {
  try {
    // parserLog.debug('envelope %O', envelope);
    // this function pointer point to all the functions in parsers/*

    // as argument they take function(source ({.jsdom, .html}, previous {...}))
    const retval = await dissectorF(source, envelope.findings);

    if (_.isUndefined(retval) || _.isNull(retval) || retval === false)
      envelope.log[dissectorName] = '∅';
    else envelope.log[dissectorName] = JSON.stringify(retval).length;

    return retval;
  } catch (error) {
    parserLog.error(
      'Error in %s: %s %s',
      dissectorName,
      error.message,
      error.stack
    );
    _.set(envelope.log, dissectorName, '!E');
    throw error;
  }
}

export const updateMetadataAndMarkHTML =
  ({ db }: ParserProviderContext) =>
  async (e: Metadata | null): Promise<[number, number] | null> => {
    parserLog.debug('Update metadata %O', e);

    if (!e) return null;
    const r = await db.api.upsertOne(
      db.write,
      nconf.get('schema').metadata,
      { id: e.id },
      e
    );

    parserLog.debug('Upsert metadata by %O: %O', { id: e.id }, r);

    const u = await db.api.updateOne(
      db.write,
      nconf.get('schema').htmls,
      { id: e.id },
      { processed: true }
    );
    parserLog.debug('Upsert html by %O: %O', { id: e.id }, u);
    return [r.modifiedCount, u.modifiedCount];
  };

interface PipelineResults {
  failures: Record<string, any>;
  source: any;
  log: Record<string, any>;
  findings: Record<string, any>;
}

async function pipeline(
  e: any,
  parser: (envelope: any, findings: any) => Promise<any>
): Promise<PipelineResults | null> {
  try {
    processedCounter++;
    const structure: PipelineResults = {
      failures: {},
      source: e,
      log: {},
      findings: {},
    };

    const nature = e.html.nature.type;

    try {
      const mined = await wrapDissector(parser, nature, e, structure);
      _.set(structure.findings, 'nature', mined);
    } catch (error) {
      parserLog.error('Parser error %O', error);
      _.set(structure.failures, nature, error.message);
    }

    parserLog.error(
      '#%d\t(%d mins) http://localhost:1313/debug/html/#%s %s',
      processedCounter,
      _.round(differenceInMinutes(new Date(), new Date(e.html.savingTime)), 0),
      e.html.id
    );

    return structure;
  } catch (error) {
    parserLog.error(
      '#%d\t pipeline general failure error: %s',
      processedCounter,
      error.message
    );
    return null;
  }
}

interface ParsingChainResults {
  findings: number[];
  failures: number[];
  logof: Array<[number, number] | null>;
}

const executeParsingChain =
  (ctx: ParserProviderContext) =>
  async (
    htmlFilter: any,
    htmlAmount: number
  ): Promise<ParsingChainResults | undefined> => {
    const envelops = await getLastHTMLs(ctx)(htmlFilter, htmlAmount);

    if (!_.size(envelops.sources)) {
      nodatacounter++;
      if (nodatacounter % 10 === 1) {
        parserLog.error(
          '(data %d/ processed %d) no data at the last query: %O',
          nodatacounter,
          processedCounter,
          htmlFilter
        );
      }
      lastExecution = subMinutes(new Date(), BACKINTIMEDEFAULT).toISOString();
      computedFrequency = FREQUENCY;
      return;
    } else {
      const last = _.last(envelops.sources);
      lastExecution = (
        last ? new Date(last.html.savingTime) : new Date()
      ).toISOString();
      computedFrequency = 0.1;
    }

    if (!envelops.overflow)
      overflowLog.info('<NOT>\t\t%d documents', _.size(envelops.sources));
    else {
      const last = _.last(envelops.sources);
      const first = _.first(envelops.sources);
      overflowLog.info(
        'first html %s (on %d) <last +minutes %d> next filter set to %s',
        _.first(envelops.sources)?.html.savingTime,
        _.size(envelops.sources),
        differenceInMinutes(
          last ? new Date(last.html.savingTime) : new Date(),
          first ? new Date(first.html.savingTime) : new Date()
        ),
        lastExecution
      );
    }

    if (stats.currentamount)
      parserLog.info(
        '[+] %d htmls in new parsing sequences. (previous %d took: %s) and now process %d htmls',
        processedCounter,
        stats.currentamount,
        formatDistance(new Date(), stats.current ?? new Date(), {
          includeSeconds: true,
        }),
        _.size(envelops.sources)
      );

    stats.current = new Date();
    stats.currentamount = _.size(envelops.sources);

    const results: Array<PipelineResults | null> = [];

    for (const entry of envelops.sources) {
      const parser = ctx.parsers[entry.html.nature.type];
      const result = await pipeline(entry, parser);
      results.push(result);
    }
    /* results is a list of objects: [ {
        source: { dom, html },
        findings: { $dissector1, $dissector2 },
        failures: { $dissectorN, $dissectorX } },
        log: { $dissectorName: sizeOfFinding }
    ] */

    // eslint-disable-next-line
    const tableOutput = _.map(results, function (r) {
      if (r) {
        r.log.id = r.source.html.id;
        if (r.findings) {
          const findingsOutput = Object.entries(r.findings).reduce(
            (acc, [k, v]) => {
              return {
                ...acc,
                [k]: k === 'nature' ? v.type : 'undefined',
              };
            },
            {}
          );

          return {
            ...r.log,
            ...findingsOutput,
          };
        } else {
          return {
            ...r.log,
            ...r.failures,
            type: 'error',
          };
        }
      }
      return {};
    });
    console.table(tableOutput);

    const newmetas: Array<Metadata | null> = [];
    for (const entry of results) {
      try {
        const m = ctx.toMetadata(entry);
        if (entry) {
          m.savingTime = new Date(entry.source.html.savingTime);
          m.id = entry.source.html.id;
          m.publicKey = entry.source.html.publicKey;
          parserLog.debug('Metadata built %O', m);
        }
        newmetas.push(m);
      } catch (error) {
        parserLog.error(
          'Error in pchain.buildMetadata [%s] id %s',
          error.message,
          entry?.source.html.id
        );
        parserLog.error('%s', error.stack);
      }
    }

    const logof: Array<[number, number] | null> = [];
    for (const metadata of newmetas) {
      try {
        const x = await updateMetadataAndMarkHTML(ctx)(metadata);
        logof.push(x);
      } catch (error) {
        parserLog.error(
          'Error in pchain.updateMetaAndMarkHTML [%s] id %s',
          error.message,
          metadata?.id
        );
        parserLog.error('%s', error.stack);
      }
    }

    return {
      findings: _.map(results, function (e) {
        return _.size(e?.findings ?? []);
      }),
      failures: _.map(results, function (e) {
        return _.size(e?.failures ?? []);
      }),
      logof,
    };
  };

interface ExecuteParams {
  filter?: string[];
  stop: number;
  repeat: boolean;
  // exit after first run
  singleUse?: boolean | string;
  htmlAmount: number;
}

type ExecutionOutput =
  | {
      type: 'Success';
      payload: any;
    }
  | {
      type: 'Error';
      payload: any;
    };

const actualExecution =
  (ctx: ParserProviderContext) =>
  async ({
    repeat,
    stop,
    singleUse,
    filter,
    htmlAmount,
  }: ExecuteParams): Promise<ExecutionOutput> => {
    try {
      // pretty lamest, but I need an infinite loop on an async function -> IDFC!
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const _times of _.times(0xffffff)) {
        let htmlFilter: Record<string, any> = {
          savingTime: {
            $gt: new Date(lastExecution),
          },
        };
        if (!repeat) htmlFilter.processed = { $exists: false };

        if (filter) {
          parserLog.error('Focus filter on %d IDs', _.size(filter));
          htmlFilter.id = { $in: filter };
        }
        if (typeof singleUse === 'string') {
          parserLog.error('Targeting a specific htmls.id');
          htmlFilter = { id: singleUse };
        }

        if (stop && stop <= processedCounter) {
          parserLog.debug(
            'Reached configured limit of %d ( processed: %d)',
            stop,
            processedCounter
          );
          return {
            type: 'Success',
            payload: processedCounter,
          };
        }

        const results = await executeParsingChain(ctx)(htmlFilter, htmlAmount);

        if (typeof singleUse === 'boolean' && singleUse) {
          parserLog.info('Single execution done!');
          return {
            type: 'Success',
            payload: results,
          };
        }
        const sleepTime = computedFrequency * 1000;
        parserLog.debug('Sleeping for %d', sleepTime);
        await sleep(sleepTime);
      }
      parserLog.info(
        "Please note what wasn't supposed to never happen, just happen: restart the software ASAP."
      );
      return { type: 'Success', payload: {} };
    } catch (e) {
      parserLog.error('Error in filterChecker', e.message, e.stack);
      // process.exit(1);
      return {
        type: 'Error',
        payload: e,
      };
    }
  };

interface ParserProviderOpts extends ExecuteParams {
  /* minutes to look back */
  backInTime: number;
}

interface ParserProvider {
  run: (opts: ParserProviderOpts) => Promise<any>;
}

let lastExecution: string;
let computedFrequency = 10;

interface ParserProviderContext {
  db: {
    api: typeof mongo3;
    read: MongoClient;
    write: MongoClient;
  };
  parsers: Record<string, (envelope: any, findings: any) => Promise<any>>;
  toMetadata: (e: PipelineResults | null) => any;
}

export const GetParserProvider = (
  ctx: ParserProviderContext
): ParserProvider => {
  return {
    run: async ({
      singleUse,
      repeat,
      htmlAmount,
      stop,
      backInTime,
      filter,
    }: ParserProviderOpts) => {
      if (filter && typeof singleUse === 'string')
        throw new Error("Invalid combo, you can't use --filter and --id");

      if (typeof singleUse === 'string' && htmlAmount !== AMOUNT_DEFAULT)
        parserLog.error('Ignoring --amount because of --id');

      if (stop && htmlAmount > stop) {
        htmlAmount = stop;
        parserLog.error('--stop %d imply --amount %d', stop, htmlAmount);
      }

      const actualRepeat =
        repeat ||
        typeof singleUse === 'undefined' ||
        !!filter ||
        backInTime !== BACKINTIMEDEFAULT;
      if (actualRepeat !== repeat) parserLog.error('--repeat it is implicit!');

      lastExecution = subMinutes(new Date(), backInTime).toISOString();

      const result = await actualExecution(ctx)({
        filter,
        repeat: actualRepeat,
        stop,
        singleUse,
        htmlAmount,
      });

      // eslint-disable-next-line
      console.table([result]);

      return result;
    },
  };
};
