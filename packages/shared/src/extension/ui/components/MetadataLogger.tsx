import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
  TypographyProps,
} from '@material-ui/core';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as M from 'fp-ts/lib/Map';
import * as O from 'fp-ts/lib/Option';
import * as S from 'fp-ts/lib/string';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import * as React from 'react';
import ReactJSON from 'react-json-view';
import { v4 as uuid } from 'uuid';
import {
  executionLoop,
  ParserConfiguration,
  ParserContext,
  ParserFn,
} from '../../../providers/parser.provider';
import { Hub } from '../../hub';
import trexLogger from '../../logger';

const log = trexLogger.extend('metadata-logger');

export interface MetadataLoggerProps<
  S,
  M,
  C extends ParserConfiguration,
  PP extends Record<string, ParserFn<S, M, C>>
> {
  hub: Hub<any>;
  mapEvent: (id: string, e: unknown) => S | null;
  decode: t.Decode<unknown, S>;
  parser: Omit<
    ParserContext<S, M, C, PP>,
    | 'db'
    | 'codecs'
    | 'getLastContributions'
    | 'getMetadata'
    | 'saveResults'
    | 'getContributions'
  >;
}

interface MetadataLoggerEntry<S, M> {
  source: S;
  metadata?: M;
  errors: {
    decode: string[];
    parser: string[];
  };
}

type MetadataLoggerState<S, M> = Map<string, MetadataLoggerEntry<S, M>>;

const ParserErrorsHeader: React.FC<{ count: number } & TypographyProps> = ({
  count,
  ...props
}) => (
  <Typography
    variant="subtitle1"
    component="span"
    {...props}
    style={{ color: 'red', ...props.style }}
  >
    Parser {count}
  </Typography>
);

const MetadataHeader: React.FC<{ count: number } & TypographyProps> = ({
  count,
  ...props
}) => (
  <Typography
    variant="subtitle1"
    component="span"
    {...props}
    style={{ color: 'green', ...props.style }}
  >
    M {count}
  </Typography>
);

const DecodeErrorsHeader: React.FC<{ count: number } & TypographyProps> = ({
  count,
  ...props
}) => (
  <Typography
    variant="subtitle1"
    component="span"
    {...props}
    style={{ color: 'orange', ...props.style }}
  >
    Decode {count}
  </Typography>
);

export const MetadataLogger = <
  S extends any,
  M extends any,
  C extends ParserConfiguration,
  PP extends Record<string, ParserFn<S, M, C>>
>({
  hub,
  mapEvent,
  decode,
  parser,
}: MetadataLoggerProps<S, M, C, PP>): JSX.Element => {
  const [contributions, setContributions] = React.useState<
    MetadataLoggerState<S, M>
  >(new Map());

  const contributionEntries = pipe(contributions, M.toArray(S.Ord));

  const getContributions = React.useCallback(
    (f, s, a) => {
      const sources = contributionEntries.map(([key, c]) => c.source);
      log.debug('Get last sources %O', sources);
      return Promise.resolve({ sources, errors: 0, overflow: false });
    },
    [contributionEntries]
  );

  const getMetadata = React.useCallback(
    async (e: any): Promise<M | null> => {
      log.debug('Store %O', contributions);
      const entryId = parser.getEntryId(e);

      const m = pipe(
        contributions,
        M.lookup(S.Eq)(entryId),
        O.filterMap((m) => (m.metadata ? O.some(m.metadata) : O.none)),
        O.toNullable
      );

      log.debug('Get metadata from entry id %s => %O', entryId, m);

      return m;
    },
    [contributionEntries]
  );

  const saveResults = React.useCallback(
    (s: any, m: any) => {
      log.debug('Save results: source %O, metadata %O', s, m);
      const metadataUpsert = pipe(
        contributions,
        M.lookup(S.Eq)(s.id),
        O.fold(
          (): MetadataLoggerEntry<S, M> => ({
            errors: {
              parser: [],
              decode: [],
            },
            source: s,
            metadata: m,
          }),
          (c) => ({
            ...c,
            metadata: m,
          })
        )
      );
      log.debug('Old contributions %O', contributions);
      pipe(
        contributions,
        M.upsertAt(S.Eq)(parser.getEntryId(s), metadataUpsert),
        (cc) => {
          log.debug('New contributions %s', cc);
          setContributions(cc);
        }
      );

      return Promise.resolve({
        metadata: m,
        source: s,
        count: { metadata: 1 },
      });
    },
    [contributionEntries]
  );

  const parserCtx: ParserContext<S, M, C, PP> = {
    ...parser,
    log,
    db: { api: {} as any, read: {} as any, write: {} as any },
    codecs: { metadata: t.any, contribution: t.any },
    getMetadata,
    getContributions,
    saveResults,
  };

  React.useEffect(() => {
    log.debug('Start parsing %O', M.toArray(S.Ord)(contributions));
    const unprocessedContributions = pipe(
      contributions,
      // once the parser has finished the entry should have either `metadata` or some `errors.parser`
      M.filter((s) => s.metadata === undefined && s.errors.parser.length === 0)
    );

    log.debug(
      'Unprocessed contributions %O',
      M.toArray(S.Ord)(unprocessedContributions)
    );

    if (unprocessedContributions.size >= 1) {
      void executionLoop(parserCtx)({
        singleUse: true,
        htmlAmount: 1,
        stop: 1,
      }).then((r) => {
        log.debug('Parser output %O', r);
        if (r.type === 'Success') {
          const outputContributions = r.payload.reduce((acc, p) => {
            const sourceId = parser.getEntryId(p.source);

            let parserErrors: any[] = [];
            if (p.failures) {
              parserErrors = Object.entries(p.failures).reduce<any[]>(
                (acc, [key, value]) => {
                  if (value instanceof Error) {
                    return acc.concat({
                      [key]: value.message,
                    });
                  }

                  return acc.concat({
                    [key]: value,
                  });
                },
                []
              );
            }

            const entry = pipe(
              acc,
              M.lookup(S.Eq)(sourceId),
              O.fold(
                (): MetadataLoggerEntry<S, M> => ({
                  source: p.source,
                  metadata: undefined,
                  errors: {
                    decode: [],
                    parser: parserErrors,
                  },
                }),
                (m) => ({
                  ...m,
                  metadata: p.metadata,
                  errors: {
                    ...m.errors,
                    parser: parserErrors,
                  },
                })
              )
            );

            return pipe(acc, M.upsertAt(S.Eq)(sourceId, entry));
          }, contributions);

          log.debug('Update contributions %O', outputContributions);
          setContributions(outputContributions);
        }
      });
    }
  }, [contributionEntries]);

  const onAnyEvent = (event: any): void => {
    // log.debug('event received', event);
    const eventId = uuid();
    const datum = mapEvent(eventId, event);

    if (datum === null) {
      log.debug('Avoid parsing event type %s', event.type);
      return;
    }

    log.debug('Decoding event %O', datum);
    // log.debug('datum mapped %O', datum);
    const contribution = decode(datum);
    // when the received event decode fails
    // we update the `decodeErrors` map
    // to render the errors

    if (E.isLeft(contribution)) {
      const errors = PathReporter.report(contribution);

      log.debug('Decode errors %O', errors);

      const decodeErrorUpsert = pipe(
        contributions,
        M.lookup(S.Eq)(eventId),
        O.fold(
          (): MetadataLoggerEntry<S, M> => ({
            errors: { parser: [], decode: errors },
            metadata: undefined,
            source: datum,
          }),
          (c) => ({
            ...c,
            errors: {
              ...c.errors,
              decode: errors,
            },
          })
        )
      );

      pipe(
        contributions,
        M.upsertAt(S.Eq)(eventId, decodeErrorUpsert),
        setContributions
      );
    } else {
      log.debug('Contribution id %s', eventId);

      pipe(
        contributions,
        M.lookup(S.Eq)(eventId),
        O.fold(
          () => ({
            metadata: undefined,
            source: contribution.right,
            errors: {
              decode: [],
              parser: [],
            },
          }),
          (c) => ({ ...c, source: contribution.right })
        ),
        (c) => {
          log.debug('Contribution %O', c);
          pipe(contributions, M.upsertAt(S.Eq)(eventId, c), setContributions);
        }
      );
    }
  };

  React.useEffect(() => {
    hub.onAnyEvent(onAnyEvent);
  }, []);

  log.debug('contributions', contributions);

  const { summary, details } = React.useMemo(() => {
    const metadata = pipe(
      contributions,
      M.filter((c) => !!c.metadata)
    );

    const decodeErrors = pipe(
      contributions,
      M.filter((c) => c.errors.decode.length > 0)
    );

    const parserErrors = pipe(
      contributions,
      M.filter((c) => c.errors.parser.length > 0)
    );

    return {
      summary: (
        <div>
          <MetadataHeader count={metadata.size} style={{ marginRight: 10 }} />
          <DecodeErrorsHeader
            count={decodeErrors.size}
            style={{ marginRight: 10 }}
          />
          <ParserErrorsHeader count={parserErrors.size} />
        </div>
      ),
      details: (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 550,
            overflow: 'auto',
          }}
        >
          <ul style={{ padding: 0, listStyle: 'none' }}>
            {pipe(
              contributions,
              M.mapWithIndex((key, data) => (
                <li
                  key={key}
                  style={{
                    position: 'relative',
                    width: '100%',
                    color: 'red',
                  }}
                >
                  <div>
                    <Typography style={{ color: 'green' }}>
                      {(data.metadata as any)?.type}:{' '}
                      {parser.getEntryId(data.source as any)}
                    </Typography>
                    <span>
                      <ReactJSON
                        src={(data.metadata as any) ?? {}}
                        collapsed={true}
                      />
                    </span>
                  </div>
                  {data.errors.parser.length > 0 ? (
                    <div>
                      <ParserErrorsHeader count={data.errors.parser.length} />
                      {data.errors.parser.map((l, i) => (
                        <span
                          key={i}
                          style={{
                            position: 'relative',
                            display: 'block',
                          }}
                        >
                          {JSON.stringify(l)}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {data.errors.decode.length > 0 ? (
                    <div>
                      <DecodeErrorsHeader count={data.errors.decode.length} />

                      <ReactJSON src={data.source as any} collapsed={true} />

                      {data.errors.decode.map((l, i) => (
                        <span
                          key={i}
                          style={{
                            position: 'relative',
                            display: 'block',
                          }}
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </li>
              )),
              M.toArray(S.Ord),
              (entries) => entries.map(([k, e]) => e)
            )}
          </ul>
        </div>
      ),
    };
  }, [contributionEntries]);

  return (
    <Box
      style={{
        position: 'fixed',
        width: '100%',
        minWidth: 200,
        maxWidth: 400,
        maxHeight: 600,
        minHeight: 30,
        bottom: 10,
        right: 10,
        zIndex: 9999,
      }}
    >
      <Accordion style={{ position: 'relative', width: '100%' }}>
        <AccordionSummary style={{ maxWidth: 200 }}>{summary}</AccordionSummary>
        <AccordionDetails style={{ maxWidth: 400 }}>{details}</AccordionDetails>
      </Accordion>
    </Box>
  );
};
