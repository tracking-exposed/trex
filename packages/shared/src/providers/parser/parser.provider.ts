import { formatDistance } from 'date-fns';
import differenceInMinutes from 'date-fns/differenceInMinutes';
import subMinutes from 'date-fns/subMinutes';
import * as t from 'io-ts';
import _ from 'lodash';
import { MongoClient } from 'mongodb';
import { Logger, trexLogger } from '../../logger';
import { sleep } from '../../utils/promise.utils';
import type * as mongo3 from '../mongo.provider';

/**
 * The parser configuration
 */
export interface ParserConfiguration {
  errorReporter?: (e: unknown) => void;
}

/**
 * The parser function
 *
 * @typeParam S - The source
 * @typeParam M - The metadata
 * @typeParam C - The configuration
 */
export type ParserFn<S, M, C> = (
  entry: ContributionWithDOM<S>,
  findings: any,
  config: C
) => Promise<M | null>;

export type ContributionWithDOM<S> = S & { jsdom: Document };

export type ContributionAndDOMFn<S> = (s: S) => ContributionWithDOM<S>;

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
export interface PipelineInput<
  S,
  PP extends Record<string, ParserFn<S, any, any>>
> {
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
  PP extends Record<string, ParserFn<S, any, any>>
> extends PipelineInput<S, PP> {
  metadata: M;
  count: { [key: string]: number };
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

interface ExecutionOutputSuccess<
  S,
  M,
  PP extends Record<string, ParserFn<S, any, any>>
> {
  type: 'Success';
  payload: Array<PipelineOutput<S, M, PP>>;
}

interface ExecutionOutputError {
  type: 'Error';
  payload: any;
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
  PP extends Record<string, ParserFn<S, any, any>>
> = ExecutionOutputSuccess<S, M, PP> | ExecutionOutputError;

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
  C extends ParserConfiguration,
  PP extends Record<string, ParserFn<S, any, C>>
> {
  ctx: ParserContext<S, M, C, PP>;
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

export interface CollectionOpts {
  contribution: string;
  metadata: string;
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
 * Get metadata function
 *
 * @typeParam S - Source
 */
export type GetMetadataFn<S, M> = (e: S) => Promise<M | null>;

/**
 * Build metadata function
 *
 * @param e The payload produced by the pipeline
 * @param metadata - The metadata already present in the DB, if any
 */
export type BuildMetadataFn<
  S,
  M,
  PP extends Record<string, ParserFn<S, any, any>>
> = (e: PipelineInput<S, PP>, metadata: M | null) => M | null;

export type SaveResults<S, M> = (
  source: ContributionWithDOM<S>,
  metadata: M
) => Promise<{
  count: { [key: string]: number };
  metadata: M;
  source: S;
}>;

/**
 * Parser provider context
 *
 * @typeParam S - The source io-ts codec
 * @typeParams M - The metadata io-ts codec
 * @typeParam PP - The parsers map
 */
export interface ParserProviderContext<
  S,
  M,
  C extends ParserConfiguration,
  PP extends Record<string, ParserFn<S, any, C>>
> {
  db: ParserProviderContextDB;
  codecs: {
    contribution: t.Type<S>;
    metadata: t.Type<M>;
  };
  /**
   * Parsers map
   */
  parsers: PP;
  /**
   * Get contributions to be processed
   */
  getContributions: GetContributionsFn<S>;
  /**
   * Add DOM to entry
   */
  addDom: (e: S) => ContributionWithDOM<S>;
  /**
   * Get entry ID
   */
  getEntryId: (e: ContributionWithDOM<S>) => string;
  /**
   * Get entry nature type
   */
  getEntryNatureType: (e: ContributionWithDOM<S>) => string;
  /**
   * Return the entry date
   */
  getEntryDate: (e: ContributionWithDOM<S>) => Date;
  /**
   * Get entry ID
   */
  getMetadata: GetMetadataFn<S, M>;
  /**
   * create metadata from parsed information
   */
  buildMetadata: BuildMetadataFn<S, M, PP>;
  /**
   * Callback to save both source and metadata
   */
  saveResults: SaveResults<S, M>;
  config: C;
}

/**
 * The context given to parser
 *
 * @typeParam S - The io-ts codec for source
 * @typeParam M - The io-ts codec for metadata
 * @typeParam PP - The parser functions map
 */
export interface ParserContext<
  S,
  M,
  C extends ParserConfiguration,
  PP extends Record<string, ParserFn<S, any, any>>
> extends ParserProviderContext<S, M, C, PP> {
  log: Logger;
  name: string;
}

// the loop frequency in second
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

export const wrapDissector =
  <
    T extends t.Mixed,
    M extends t.Mixed,
    C extends ParserConfiguration,
    PP extends Record<string, ParserFn<t.TypeOf<T>, any, C>>
  >(
    ctx: ParserContext<t.TypeOf<T>, t.TypeOf<M>, C, PP>
  ) =>
  async (
    dissectorF: ParserFn<t.TypeOf<T>, any, C>,
    dissectorName: string,
    source: t.TypeOf<T>,
    results: PipelineInput<t.TypeOf<T>, PP>
  ): Promise<PipelineInput<t.TypeOf<T>, PP>> => {
    try {
      // parserLog.debug('envelope %O', envelope);
      // this function pointer point to all the functions in parsers/*

      // as argument they take function(source ({.jsdom, .html}, previous {...}))
      const retval = await dissectorF(source, results.findings, ctx.config);

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
      ctx.log.error('Error while parsing %s: %O', dissectorName, error);
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
  };

export const parsePipeline =
  <
    T extends t.Mixed,
    M extends t.Mixed,
    C extends ParserConfiguration,
    PP extends Record<string, ParserFn<t.TypeOf<T>, any, C>>
  >(
    ctx: ParserContext<t.TypeOf<T>, t.TypeOf<M>, C, PP>
  ) =>
  async (
    e: ContributionWithDOM<t.TypeOf<T>>,
    parsers: PP
  ): Promise<PipelineInput<t.TypeOf<T>, PP>> => {
    let results: PipelineInput<t.TypeOf<T>, PP> = {
      failures: {},
      source: e,
      log: {},
      findings: {} as any,
    };

    const nature = ctx.getEntryNatureType(e);
    ctx.log.debug('Entry nature %s', nature);
    const dissectorWrapper = wrapDissector(ctx);

    try {
      processedCounter++;

      ctx.log.debug('Using parsers %O', Object.keys(parsers));

      for (const [parserKey, parserFn] of Object.entries(parsers)) {
        const currentResults = await dissectorWrapper(
          parserFn,
          parserKey,
          e,
          results
        );
        results = currentResults;
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
    C extends ParserConfiguration,
    PP extends Record<string, ParserFn<t.TypeOf<T>, any, C>>
  >(
    ctx: ParserContext<t.TypeOf<T>, t.TypeOf<M>, C, PP>
  ) =>
  async (
    envelops: LastContributions<ContributionWithDOM<t.TypeOf<T>>>
  ): Promise<
    Array<PipelineOutput<ContributionWithDOM<t.Type<T>>, t.TypeOf<M>, PP>>
  > => {
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

    const pipe = parsePipeline<T, M, C, PP>(ctx);

    const results: Array<PipelineOutput<t.TypeOf<T>, t.TypeOf<M>, PP>> = [];

    ctx.log.debug('Sources %O', envelops.sources.map(ctx.getEntryId));

    for (const source of envelops.sources) {
      const entry = ctx.addDom(source);
      const entryId = ctx.getEntryId(entry);

      ctx.log.debug('Parsing entry %s', entryId);

      const result = await pipe(entry, ctx.parsers);

      ctx.log.debug('Parsed %O', result);
      const oldMetadata = await ctx.getMetadata(entry);
      const metadata = ctx.buildMetadata(result, oldMetadata);

      // ctx.log.debug('Metadata %O', metadata);

      if (metadata) {
        const m = await ctx.saveResults(result.source, metadata);

        results.push({ ...result, ...m });
      } else {
        if (ctx.config.errorReporter) {
          ctx.config.errorReporter(entry);
        }

        results.push({
          ...result,
          metadata: null,
          count: { metadata: 0, source: 0 },
        });
      }
    }

    return results;
  };

const getMemoryUsed = (): NodeJS.MemoryUsage => {
  const used = process.memoryUsage();
  const memoryLog: any = {};
  for (const key in used) {
    memoryLog[key] = Math.round(((used as any)[key] / 1024 / 1024) * 100) / 100;
  }
  return memoryLog;
};

/* yes a better way might exist */
let previousFrequency = 0;

export const executionLoop =
  <
    T extends t.Mixed,
    M extends t.Mixed,
    C extends ParserConfiguration,
    PP extends Record<string, ParserFn<t.TypeOf<T>, any, C>>
  >(
    ctx: ParserContext<t.TypeOf<T>, t.TypeOf<M>, C, PP>
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

    processedCounter = 0;
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
        ctx.log.info('Memory usage %O (MB)', getMemoryUsed());

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
            'Reached configured limit of %d (processed: %d)',
            stop,
            processedCounter
          );

          break;
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
          lastExecution = new Date();
          const currentResult = await parseContributions(ctx)(envelops);
          ctx.log.debug(
            'Processed sources %O',
            currentResult.map((r) => ctx.getEntryId(r.source))
          );

          printResultOutput(ctx.getEntryId, {
            type: 'Success',
            payload: currentResult,
          });
        }

        if (singleUse) {
          ctx.log.info('Single execution done!');
          break;
        }
        if (computedFrequency !== previousFrequency) {
          previousFrequency = computedFrequency;
        }
        const sleepTime = computedFrequency * 1000;
        ctx.log.debug('Sleep for %dms', sleepTime);
        await sleep(sleepTime);
        processedCounter++;
      }

      return { type: 'Success', payload: results };
    } catch (e: any) {
      ctx.log.error('Error in filterChecker', e.message, e.stack);

      const result: ExecutionOutputError = {
        type: 'Error',
        payload: e,
      };
      printResultOutput(ctx.getEntryId, result);

      return result;
    }
  };

export const markOutputField = <R extends Record<string, any>>(
  obj: R
): Record<string, string> => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    return {
      ...acc,
      [key]: `${value !== null && value !== undefined ? 'OK' : '!E'}`,
    };
  }, {});
};

export const getSuccessfulOutput = <
  S,
  M,
  C extends ParserConfiguration,
  PP extends Record<string, ParserFn<S, any, any>>
>(
  getEntryId: ParserProviderContext<S, M, C, PP>['getEntryId'],
  output: Array<PipelineOutput<ContributionWithDOM<S>, M, PP>>
): any => {
  return output.reduce((acc, { source, metadata, failures, log, count }) => {
    const index = getEntryId(source).substring(0, 6);
    const { id, nature } = (metadata as any) ?? {};
    const n: any = nature;
    return {
      ...acc,
      [index]: {
        ...log,
        id,
        nature: n?.nature?.type ?? n?.type,
        failures: JSON.stringify(
          Object.entries(failures).map(([key, value]) => ({
            [key]: value.message,
          }))
        ),
        count: JSON.stringify(count),
      },
    };
  }, {});
};

/**
 * Convert the pipeline output to an object compatible with `console.table`
 *
 * @param getEntryId - A function that retrieves entry id
 * @param p - An array of outputs from pipeline {@link PipelineOutput}
 *
 * @returns An object with `log`, `metadata` and `findings` keys
 */
export const printResultOutput = <
  S extends t.Mixed,
  M extends t.Mixed,
  C extends ParserConfiguration,
  PP extends Record<string, ParserFn<t.TypeOf<S>, any, C>>
>(
  getEntryId: ParserProviderContext<
    t.TypeOf<S>,
    t.TypeOf<M>,
    C,
    PP
  >['getEntryId'],
  output: ExecutionOutput<t.TypeOf<S>, t.TypeOf<M>, PP>
): any => {
  if (output.type === 'Success') {
    const tableOutput = getSuccessfulOutput(getEntryId, output.payload);
    // eslint-disable-next-line
    console.table(tableOutput);
  } else {
    // eslint-disable-next-line no-console
    console.error(output.payload);
  }
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
  C extends ParserConfiguration,
  PP extends Record<string, ParserFn<t.TypeOf<S>, any, C>>
>(
  name: string,
  ctx: ParserProviderContext<t.TypeOf<S>, t.TypeOf<M>, C, PP>
): ParserProvider<t.TypeOf<S>, t.TypeOf<M>, C, PP> => {
  const log = trexLogger.extend(name);

  return {
    ctx: {
      ...ctx,
      name,
      log,
    },

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

      let repeat;
      if (typeof _repeat === 'undefined') {
        const undefinedSingleUse = typeof singleUse === 'undefined';
        const filterExists = !!filter;
        const backInTimeExists = backInTime !== BACKINTIMEDEFAULT;

        repeat = undefinedSingleUse || filterExists || backInTimeExists;
        log.debug(
          'Repeat? %O => %o',
          {
            singleUse: undefinedSingleUse,
            filter: filterExists,
            backInTime: backInTimeExists,
          },
          repeat
        );
      } else {
        repeat = _repeat;
      }

      lastExecution = subMinutes(new Date(), backInTime);

      const loop = executionLoop({
        ...ctx,
        name,
        log,
      });

      const output = await loop({
        filter,
        repeat,
        stop,
        singleUse,
        htmlAmount,
      });

      return output;
    },
  };
};
