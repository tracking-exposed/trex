import { Logger, trexLogger } from '@shared/logger';
import { sleep } from '@shared/utils/promise.utils';
import { formatDistance } from 'date-fns';
import differenceInMinutes from 'date-fns/differenceInMinutes';
import subMinutes from 'date-fns/subMinutes';
import _ from 'lodash';
import { MongoClient } from 'mongodb';
import * as mongo3 from './mongo.provider';

export type ParserFn<S> = (entry: S, findings?: any) => any | null;

export interface LastContributions<S> {
  errors: number;
  overflow: boolean;
  sources: S[];
}

export interface PipelineResults<T> {
  failures: Record<string, any>;
  source: T;
  log: Record<string, any>;
  findings: Record<string, any>;
}

export interface ParsingChainResults {
  findings: number[];
  failures: number[];
  // logof: Array<[number, number] | null>;
  metadata: Metadata[];
}

export interface ExecuteParams {
  filter?: string[];
  /** The process exit after `stop` elements analyzed */
  stop: number;
  /** Process already `processed` datum */
  repeat?: boolean;
  // exit after first run
  singleUse?: boolean | string;
  // Htmls elements to load per time
  htmlAmount: number;
}

export type ExecutionOutput =
  | {
      type: 'Success';
      payload: any;
    }
  | {
      type: 'Error';
      payload: any;
    };

export interface ParserProviderOpts extends ExecuteParams {
  /* minutes to look back */
  backInTime: number;
}

export interface ParserProvider {
  run: (opts: ParserProviderOpts) => Promise<any>;
}

export interface ParserProviderContext<S> {
  db: {
    api: typeof mongo3;
    read: MongoClient;
    write: MongoClient;
  };
  parsers: Record<string, ParserFn<S>>;
  getContributions: (
    filter: any,
    skip: number,
    limit: number
  ) => Promise<LastContributions<S>>;
  getEntryNatureType: (e: S) => string;
  getEntryDate: (e: S) => Date;
  saveResults: (e: PipelineResults<S> | null) => Promise<{
    metadata: any;
    count: { [key: string]: number };
  } | null>;
}

interface ParserContext<S> extends ParserProviderContext<S> {
  log: Logger;
}

const FREQUENCY = 4;
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

export async function wrapDissector<T>(
  dissectorF: ParserFn<T>,
  dissectorName: string,
  source: T,
  envelope: PipelineResults<T>
): Promise<any> {
  try {
    // parserLog.debug('envelope %O', envelope);
    // this function pointer point to all the functions in parsers/*

    // as argument they take function(source ({.jsdom, .html}, previous {...}))
    const retval = dissectorF(source, envelope.findings);

    if (_.isUndefined(retval) || _.isNull(retval) || retval === false)
      envelope.log[dissectorName] = '∅';
    else envelope.log[dissectorName] = JSON.stringify(retval).length;

    return retval;
  } catch (error) {
    _.set(envelope.log, dissectorName, '!E');
    throw error;
  }
}

const pipeline =
  <T>(ctx: ParserContext<T>) =>
  async (e: T, parser: ParserFn<T>): Promise<PipelineResults<T> | null> => {
    try {
      processedCounter++;
      const results: PipelineResults<T> = {
        failures: {},
        source: e,
        log: {},
        findings: {},
      };

      const nature = ctx.getEntryNatureType(e);

      try {
        const mined = await wrapDissector(parser, nature, e, results);
        _.set(results.findings, 'nature', mined);
      } catch (error) {
        ctx.log.error('Parser not implemented for nature [%s]', nature);
        _.set(results.failures, nature, error.message);
      }

      return results;
    } catch (error) {
      ctx.log.error(
        '#%d\t pipeline general failure error: %s',
        processedCounter,
        error.message
      );
      return null;
    }
  };

export const parseContributions =
  <T>(ctx: ParserContext<T>) =>
  async (
    envelops: LastContributions<T>
  ): Promise<ParsingChainResults | undefined> => {
    const last = _.last(envelops.sources);
    lastExecution = last ? ctx.getEntryDate(last) : new Date();
    computedFrequency = 0.1;

    if (!envelops.overflow)
      ctx.log.info(
        'No more documents to load, total %d',
        _.size(envelops.sources)
      );
    else {
      const last = _.last(envelops.sources);
      const first = _.first(envelops.sources);
      ctx.log.info(
        'first html %s (on %d) <last +minutes %d> next filter set to %s',
        first ? ctx.getEntryDate(first) : undefined,
        _.size(envelops.sources),
        differenceInMinutes(
          last ? new Date(ctx.getEntryDate(last)) : new Date(),
          first ? new Date(ctx.getEntryDate(first)) : new Date()
        ),
        lastExecution
      );
    }

    if (stats.currentamount)
      ctx.log.info(
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

    const results: Array<PipelineResults<T> | null> = [];
    const pipe = pipeline<T>(ctx);
    ctx.log.debug('Sources %O', envelops.sources);
    for (const entry of envelops.sources) {
      const nature = ctx.getEntryNatureType(entry);
      ctx.log.debug('Using parser for nature %s', nature);
      const parser = ctx.parsers[nature];
      if (!parser) {
        ctx.log.debug('No parser found, skipping...');
        return;
      }

      const result = await pipe(entry, parser);
      results.push(result);
    }
    /* results is a list of objects: [ {
        source: { dom, html },
        findings: { $dissector1, $dissector2 },
        failures: { $dissectorN, $dissectorX } },
        log: { $dissectorName: sizeOfFinding }
    ] */

    const newmetas: Array<Metadata | null> = [];
    for (const entry of results) {
      try {
        if (entry) {
          const m = await ctx.saveResults(entry);
          // ctx.log.info('Metadata built %O', m);
          newmetas.push(m?.metadata);
        }
      } catch (error) {
        ctx.log.error(
          'Error in pchain.buildMetadata [%s] id %O',
          error.message,
          entry?.source
        );
        ctx.log.error('%s', error.stack);
      }
    }

    return {
      findings: _.map(results, function (e) {
        return _.size(e?.findings ?? []);
      }),
      failures: _.map(results, function (e) {
        return _.size(e?.failures ?? []);
      }),
      metadata: newmetas.filter((m): m is any => m !== null),
    };
  };

/* yes a better way might exist */
let previousFrequency = 0;

const actualExecution =
  <T>(ctx: ParserContext<T>) =>
  async ({
    repeat,
    stop,
    singleUse,
    filter,
    htmlAmount,
  }: ExecuteParams): Promise<ExecutionOutput> => {
    ctx.log.info('Starting parser with params %O', {
      repeat,
      stop,
      singleUse,
      filter,
      htmlAmount,
    });
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
          ctx.log.error('Focus filter on %d IDs', _.size(filter));
          htmlFilter.id = { $in: filter };
        }
        if (typeof singleUse === 'string') {
          ctx.log.error('Targeting a specific htmls.id');
          htmlFilter = { id: singleUse };
        }

        if (stop && stop <= processedCounter) {
          ctx.log.debug(
            'Reached configured limit of %d ( processed: %d)',
            stop,
            processedCounter
          );
          return {
            type: 'Success',
            payload: processedCounter,
          };
        }

        const envelops = await ctx.getContributions(htmlFilter, 0, htmlAmount);

        if (envelops.sources.length)
          ctx.log.debug('Data to process %d', envelops.sources.length);

        // let results: ParsingChainResults | undefined;
        if (!_.size(envelops.sources)) {
          nodatacounter++;
          if (nodatacounter % 10 === 1) {
            ctx.log.error(
              '(data %d/ processed %d) no data at the last query: %j',
              nodatacounter,
              processedCounter,
              htmlFilter
            );
          }
          lastExecution = subMinutes(new Date(), BACKINTIMEDEFAULT);
          computedFrequency = FREQUENCY;
        } else {
          await parseContributions(ctx)(envelops);
          /* remind self: before the return value (results) was used to build a console.table output */
        }

        if (singleUse) {
          ctx.log.info('Single execution done!');
          break;
        }
        if (computedFrequency !== previousFrequency) {
          ctx.log.debug('Sleeping for %f seconds', computedFrequency);
          previousFrequency = computedFrequency;
        }
        const sleepTime = computedFrequency * 1000;
        await sleep(sleepTime);
      }
      return { type: 'Success', payload: {} };
    } catch (e) {
      ctx.log.error('Error in filterChecker', e.message, e.stack);
      return {
        type: 'Error',
        payload: e,
      };
    }
  };

let lastExecution: Date;
let computedFrequency = 10;

export const GetParserProvider = <S>(
  name: string,
  ctx: ParserProviderContext<S>
): ParserProvider => {
  const log = trexLogger.extend(name);
  return {
    run: async ({
      singleUse,
      repeat: _repeat,
      htmlAmount,
      stop,
      backInTime,
      filter,
    }: ParserProviderOpts) => {
      if (filter && typeof singleUse === 'string')
        throw new Error("Invalid combo, you can't use --filter and --id");

      if (typeof singleUse === 'string' && htmlAmount !== AMOUNT_DEFAULT)
        log.error('Ignoring --amount because of --id');

      if (stop && htmlAmount > stop) {
        htmlAmount = stop;
        log.error('--stop %d imply --amount %d', stop, htmlAmount);
      }

      const repeat =
        typeof _repeat === 'undefined'
          ? typeof singleUse === 'undefined' ||
            !!filter ||
            backInTime !== BACKINTIMEDEFAULT
          : _repeat;

      if (repeat !== _repeat) log.error('--repeat it is implicit!');

      lastExecution = subMinutes(new Date(), backInTime);

      const output = await actualExecution({
        ...ctx,
        log,
      })({
        filter,
        repeat,
        stop,
        singleUse,
        htmlAmount,
      });

      // eslint-disable-next-line
      console.table(output.payload);

      return output;
    },
  };
};
