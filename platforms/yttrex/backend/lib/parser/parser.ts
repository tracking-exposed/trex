import { trexLogger } from '@shared/logger';
import { sleep } from '@shared/utils/promise.utils';
import { formatDistance } from 'date-fns';
import differenceInMinutes from 'date-fns/differenceInMinutes';
import subMinutes from 'date-fns/subMinutes';
import _ from 'lodash';
import { Metadata } from '../../models/Metadata';
import {
  ExecuteParams,
  ExecutionOutput,
  LastContributions,
  ParserFn,
  ParserProvider,
  ParserProviderContext,
  ParserProviderOpts,
  ParsingChainResults,
  PipelineResults,
} from './types';

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

const pipeline =
  <T>(ctx: ParserProviderContext<T>) =>
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
        parserLog.debug('Processing element with nature %s', nature);
        const mined = await wrapDissector(parser, nature, e, results);
        _.set(results.findings, 'nature', mined);
      } catch (error) {
        parserLog.error('Parser error %O', error);
        _.set(results.failures, nature, error.message);
      }

      return results;
    } catch (error) {
      parserLog.error(
        '#%d\t pipeline general failure error: %s',
        processedCounter,
        error.message
      );
      return null;
    }
  };

export const parseContributions =
  <T>(ctx: ParserProviderContext<T>) =>
  async (
    envelops: LastContributions<T>
  ): Promise<ParsingChainResults | undefined> => {
    const last = _.last(envelops.sources);
    lastExecution = last ? ctx.getEntryDate(last) : new Date();
    computedFrequency = 0.1;

    if (!envelops.overflow)
      overflowLog.info('<NOT>\t\t%d documents', _.size(envelops.sources));
    else {
      const last = _.last(envelops.sources);
      const first = _.first(envelops.sources);
      overflowLog.info(
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

    const results: Array<PipelineResults<T> | null> = [];
    const pipe = pipeline<T>(ctx);
    for (const entry of envelops.sources) {
      const parser = ctx.parsers[ctx.getEntryNatureType(entry)];
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
          // parserLog.debug('Metadata built %O', m);
          newmetas.push(m?.metadata);
        }
      } catch (error) {
        parserLog.error(
          'Error in pchain.buildMetadata [%s] id %O',
          error.message,
          entry?.source
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
      metadata: newmetas.filter((m): m is any => m !== null),
    };
  };

const actualExecution =
  <T>(ctx: ParserProviderContext<T>) =>
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

        const envelops = await ctx.getContributions(htmlFilter, 0, htmlAmount);

        let results: ParsingChainResults | undefined;
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
          lastExecution = subMinutes(new Date(), BACKINTIMEDEFAULT);
          computedFrequency = FREQUENCY;
        } else {
          results = await parseContributions(ctx)(envelops);
        }

        // eslint-disable-next-line
        // const tableOutput = _.map(results, function (r) {
        //   if (r) {
        //     r.log.id = r.source.html.id;
        //     if (r.findings) {
        //       const findingsOutput = Object.entries(r.findings).reduce(
        //         (acc, [k, v]) => {
        //           return {
        //             ...acc,
        //             [k]: k === 'nature' ? v?.type : JSON.stringify(v),
        //           };
        //         },
        //         {}
        //       );

        //       return {
        //         ...r.log,
        //         ...findingsOutput,
        //       };
        //     } else {
        //       return {
        //         ...r.log,
        //         ...r.failures,
        //         type: 'error',
        //       };
        //     }
        //   }
        //   return {};
        // });

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
      return {
        type: 'Error',
        payload: e,
      };
    }
  };

let lastExecution: Date;
let computedFrequency = 10;

export const GetParserProvider = <T>(
  ctx: ParserProviderContext<T>
): ParserProvider => {
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
        parserLog.error('Ignoring --amount because of --id');

      if (stop && htmlAmount > stop) {
        htmlAmount = stop;
        parserLog.error('--stop %d imply --amount %d', stop, htmlAmount);
      }

      const repeat =
        _repeat ||
        typeof singleUse === 'undefined' ||
        !!filter ||
        backInTime !== BACKINTIMEDEFAULT;
      if (repeat !== _repeat) parserLog.error('--repeat it is implicit!');

      lastExecution = subMinutes(new Date(), backInTime);

      const output = await actualExecution(ctx)({
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
