import { Logger, trexLogger } from '../logger';
import { sleep } from '../utils/promise.utils';
import { formatDistance } from 'date-fns';
import differenceInMinutes from 'date-fns/differenceInMinutes';
import subMinutes from 'date-fns/subMinutes';
import _ from 'lodash';
import { MongoClient } from 'mongodb';
import * as mongo3 from './mongo.provider';
import * as t from 'io-ts';

/**
 * The parser function
 *
 * @typeParam S - The source
 * @typeParam M - The metadata
 */
export type ParserFn<S, M> = (entry: S, findings?: any) => Promise<M | null>;

/**
 * The return structure for sources fetched by parser
 *
 * @typeParam T - Contribution
 */
export interface LastContributions<T> {
  errors: number;
  overflow: boolean;
  sources: T[];
}

/**
 * The input given to the pipeline
 *
 * @typeParam S - The source
 * @typeParam M - The metadata
 * @typeParam PP - The parser functions map
 */
export interface PipelineInput<S, PP extends Record<string, ParserFn<S, any>>> {
  failures: Record<string, any>;
  source: S;
  log: Record<string, any>;
  findings: {
    [K in keyof PP]: Awaited<ReturnType<PP[K]>>;
  };
}

/**
 * The output returned by the pipeline
 *
 * @typeParam S - The source
 * @typeParam M - The metadata
 * @typeParam PP - The parser functions map
 */
export interface PipelineOutput<
  S,
  M,
  PP extends Record<string, ParserFn<S, any>>
> extends PipelineInput<S, PP> {
  metadata: M;
}

/**
 * The execution parameters
 *
 */
export interface ExecuteParams {
  /**
   * Contribution ids to select
   */
  filter?: string[];
  /** The process exit after `stop` elements analyzed */
  stop: number;
  /** Process already `processed` datum */
  repeat?: boolean;
  // exit after first run
  singleUse?: boolean | string;
  /**
   * HTMLs elements to load per time
   */
  htmlAmount: number;
}

/**
 * The output of the execution
 *
 * @typeParam S - The source
 * @typeParam M - The metadata
 * @typeParam PP - The parsers map
 *
 * @return An object where `type` can be `Success` or `Error` and the payload contains the real result
 */
export type ExecutionOutput<
  S,
  M,
  PP extends Record<string, ParserFn<S, any>>
> =
  | {
      type: 'Success';
      payload: Array<PipelineOutput<S, M, PP>>;
    }
  | {
      type: 'Error';
      payload: any;
    };

/**
 * The options given to parser
 *
 *
 */
export interface ParserProviderOpts extends ExecuteParams {
  /**
   * minutes to look back
   */
  backInTime: number;
}

/**
 * The parser provider interface
 *
 */
export interface ParserProvider<
  S,
  M,
  PP extends Record<string, ParserFn<S, any>>
> {
  /**
   * Execute the parser with the given options {@link ParserProviderOpts}
   *
   * @return a Promise with the {@link ExecutionOutput}
   */
  run: (opts: ParserProviderOpts) => Promise<ExecutionOutput<S, M, PP>>;
}

/**
 * The DB context given to {@link GetParserProvider}
 *
 * @param api - our mongo client interface {@link mongo3}
 * @param read - a mongo client instance used to read sources
 * @param write - a mongo client instance used to write results (sources and metadata)
 */
export interface ParserProviderContextDB {
  api: typeof mongo3;
  read: MongoClient;
  write: MongoClient;
}

/**
 * Get contributions function
 *
 * @typeParam S - Source
 */
export type GetContributionsFn<S> = (
  filter: any,
  skip: number,
  limit: number
) => Promise<LastContributions<S>>;

/**
 * Build metadata function
 */
export type BuildMetadataFn<
  S,
  M,
  PP extends Record<string, ParserFn<S, any>>
> = (e: PipelineInput<S, PP>) => M | null;

/**
 * Parser provider context
 *
 * @typeParam S - The source io-ts codec
 * @typeParams M - The metadata io-ts codec
 * @typeParam PP - The parsers map
 */
export interface ParserProviderContext<
  S extends t.Mixed,
  M extends t.Mixed,
  PP extends Record<string, ParserFn<t.TypeOf<S>, any>>
> {
  db: ParserProviderContextDB;
  codecs: {
    contribution: S;
    metadata: M;
  };
  parsers: PP;
  /**
   * Get contributions to be processed
   */
  getContributions: GetContributionsFn<t.TypeOf<S>>;
  /**
   * Get entry ID
   */
  getEntryId: (e: t.TypeOf<S>) => string;
  /**
   * Get entry nature type
   */
  getEntryNatureType: (e: t.TypeOf<S>) => string;
  /**
   * Return the entry date
   */
  getEntryDate: (e: t.TypeOf<S>) => Date;
  /**
   * create metadata from parsed information
   */
  buildMetadata: BuildMetadataFn<t.TypeOf<S>, t.TypeOf<M>, PP>;
  /**
   * Callback to save both source and metadata
   */
  saveResults: (
    source: t.TypeOf<S>,
    metadata: t.TypeOf<M>
  ) => Promise<{
    metadata: t.TypeOf<M>;
    source: t.TypeOf<S>;
    count: { [key: string]: number };
  }>;
}

/**
 * The context given to parser
 *
 * @typeParam S - The io-ts codec for source
 * @typeParam M - The io-ts codec for metadata
 * @typeParam PP - The parser functions map
 */
interface ParserContext<
  S extends t.Mixed,
  M extends t.Mixed,
  PP extends Record<string, ParserFn<t.TypeOf<S>, any>>
> extends ParserProviderContext<S, M, PP> {
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

export async function wrapDissector<
  T,
  M,
  PP extends Record<string, ParserFn<T, any>>
>(
  dissectorF: ParserFn<T, M>,
  dissectorName: string,
  source: T,
  results: PipelineInput<T, PP>
): Promise<PipelineInput<T, PP>> {
  try {
    // parserLog.debug('envelope %O', envelope);
    // this function pointer point to all the functions in parsers/*

    // as argument they take function(source ({.jsdom, .html}, previous {...}))
    const retval = await dissectorF(source, results.findings);

    if (!retval) {
      return {
        ...results,
        log: {
          ...results.log,
          [dissectorName]: '∅',
        },
      };
    } else {
      return {
        ...results,
        log: {
          ...results.log,
          [dissectorName]: JSON.stringify(retval).length,
        },
        findings: {
          ...results.findings,
          [dissectorName]: retval,
        },
      };
    }
  } catch (error: any) {
    // throw error;
    return {
      ...results,
      log: {
        ...results.log,
        [dissectorName]: `!E`,
      },
      failures: {
        ...results.failures,
        [dissectorName]: error,
      },
    };
  }
}

const pipeline =
  <
    T extends t.Mixed,
    M extends t.Mixed,
    PP extends Record<string, ParserFn<t.TypeOf<T>, any>>
  >(
    ctx: ParserContext<T, M, PP>
  ) =>
  async (e: T, parsers: PP): Promise<PipelineInput<T, PP>> => {
    let results: PipelineInput<T, PP> = {
      failures: {},
      source: e,
      log: {},
      findings: {} as any,
    };

    const nature = ctx.getEntryNatureType(e);
    ctx.log.debug('Entry nature %s', nature);

    try {
      processedCounter++;

      // ctx.log.debug('Previous findings %O', results);

      for (const [parserKey, parserFn] of Object.entries(parsers)) {
        results = await wrapDissector(parserFn, parserKey, e, results);
      }

      return results;
    } catch (error: any) {
      ctx.log.error(
        '#%d\t pipeline general failure error: %s',
        processedCounter,
        error.message
      );
      results = {
        ...results,
        failures: {
          ...results.failures,
          [nature]: error,
        },
      };
    }
    return results;
  };

export const parseContributions =
  <
    T extends t.Mixed,
    M extends t.Mixed,
    PP extends Record<string, ParserFn<t.TypeOf<T>, any>>
  >(
    ctx: ParserContext<T, M, PP>
  ) =>
  async (
    envelops: LastContributions<t.TypeOf<T>>
  ): Promise<Array<PipelineOutput<t.Type<T>, t.TypeOf<M>, PP>>> => {
    const last = _.last(envelops.sources);
    // ctx.log.debug('Last source %O', last);
    lastExecution = last ? ctx.getEntryDate(last) : new Date();
    computedFrequency = 0.1;

    if (!envelops.overflow)
      ctx.log.info('<NOT>\t\t%d documents', _.size(envelops.sources));
    else {
      const last = _.last(envelops.sources);
      const first = _.first(envelops.sources);
      ctx.log.info(
        'first html %s (on %d) <last +minutes %d> next filter set to %s',
        first ? ctx.getEntryDate(first) : undefined,
        _.size(envelops.sources),
        differenceInMinutes(
          last ? ctx.getEntryDate(last) : new Date(),
          first ? ctx.getEntryDate(first) : new Date()
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

    const pipe = pipeline<T, M, PP>(ctx);

    const results: Array<PipelineOutput<t.TypeOf<T>, t.TypeOf<M>, PP>> = [];

    ctx.log.debug('Sources %O', envelops.sources);

    for (const entry of envelops.sources) {
      ctx.log.debug('Parsing entry %O', ctx.getEntryId(entry));

      const result = await pipe(entry, ctx.parsers);

      // ctx.log.debug('Parsed %O', result);
      const metadata = ctx.buildMetadata(result);
      // ctx.log.debug('Metadata %O', metadata);

      if (metadata) {
        const m = await ctx.saveResults(result.source, metadata);
        // ctx.log.debug('Saved results %O', m);

        results.push({ ...result, ...m });
      } else {
        results.push({ ...result, metadata: null });
      }
    }

    return results;
  };

/* yes a better way might exist */
let previousFrequency = 0;

export const executionLoop =
  <
    T extends t.Mixed,
    M extends t.Mixed,
    PP extends Record<string, ParserFn<t.TypeOf<T>, any>>
  >(
    ctx: ParserContext<T, M, PP>
  ) =>
  async ({
    repeat,
    stop,
    singleUse,
    filter,
    htmlAmount,
  }: ExecuteParams): Promise<ExecutionOutput<t.TypeOf<T>, t.TypeOf<M>, PP>> => {
    ctx.log.info('Starting parser with params %O', {
      repeat,
      stop,
      singleUse,
      filter,
      htmlAmount,
    });

    try {
      const results: any = [];
      // pretty lamest, but I need an infinite loop on an async function -> IDFC!
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const _times of _.times(0xffffff)) {
        ctx.log.debug(
          'Execution %d/%d (processed: %d)',
          _times,
          stop,
          processedCounter
        );
        let htmlFilter: Record<string, any> = {
          savingTime: {
            $gt: lastExecution,
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
            payload: results,
          };
        }

        ctx.log.debug(
          'Getting envelops: filter %O, amount %d',
          htmlFilter,
          htmlAmount
        );
        const envelops = await ctx.getContributions(htmlFilter, 0, htmlAmount);

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
          ctx.log.debug('Data to process %d', envelops.sources.length);
          const currentResult = await parseContributions(ctx)(envelops);
          ctx.log.debug('Processed envelops %O', currentResult);
          results.push(...currentResult);
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
      return { type: 'Success', payload: results };
    } catch (e: any) {
      ctx.log.error('Error in filterChecker', e.message, e.stack);
      return {
        type: 'Error',
        payload: e,
      };
    }
  };

/**
 * Convert the pipeline output to an object compatible with `console.table`
 *
 * @param getEntryId - A function that retrieves entry id
 * @param p - An array of outputs from pipeline {@link PipelineOutput}
 *
 * @returns An object with `log`, `metadata` and `findings` keys
 */
export const payloadToTableOutput = <
  S extends t.Mixed,
  M extends t.Mixed,
  PP extends Record<string, ParserFn<t.TypeOf<S>, any>>
>(
  getEntryId: ParserProviderContext<S, M, PP>['getEntryId'],
  p: Array<PipelineOutput<t.TypeOf<S>, t.TypeOf<M>, PP>>
): any => {
  return p.reduce<any>((acc, { source, findings, metadata, failures, log }) => {
    return {
      ...acc,
      [getEntryId(source)]: {
        log: JSON.stringify(log),
        findings: JSON.stringify(findings),
        metadata: metadata?.id ?? null,
        failures: JSON.stringify(
          Object.entries(failures).map(([key, value]) => ({
            [key]: value.message,
          }))
        ),
      },
    };
  }, {});
};
let lastExecution: Date;
let computedFrequency = 10;

/**
 *
 * @param name
 * @param ctx - The parser context {@link ParserProviderContext}
 * @returns
 */
export const GetParserProvider = <
  S extends t.Mixed,
  M extends t.Mixed,
  PP extends Record<string, ParserFn<t.TypeOf<S>, any>>
>(
  name: string,
  ctx: ParserProviderContext<S, M, PP>
): ParserProvider<t.TypeOf<S>, t.TypeOf<M>, PP> => {
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

      // reset processed counter each time the parser is run
      processedCounter = 0;

      const output = await executionLoop({
        ...ctx,
        log,
      })({
        filter,
        repeat,
        stop,
        singleUse,
        htmlAmount,
      });

      const tableOutput = payloadToTableOutput(ctx.getEntryId, output.payload);
      // eslint-disable-next-line
      console.table(tableOutput);

      return output;
    },
  };
};
