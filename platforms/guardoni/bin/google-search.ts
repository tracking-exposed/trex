import { AppError, toAppError } from '@trex/shared/src/errors/AppError';
import { GetLogger } from '@trex/shared/src/logger';
import {
  GetPuppeteer,
  PuppeteerProviderContext,
} from '@trex/shared/src/providers/puppeteer/puppeteer.provider';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { sequenceS } from 'fp-ts/lib/Apply';
import * as M from 'fp-ts/Map';
import * as O from 'fp-ts/Option';
import * as S from 'fp-ts/string';
import * as TE from 'fp-ts/TaskEither';
import fs from 'fs';
import path from 'path';
import { Page } from 'puppeteer-core';
import puppeteer from 'puppeteer-extra';
import { getDefaultConfig } from '../src/guardoni/config';
import { getChromePath } from '../src/guardoni/utils';
import * as qs from 'querystring';

interface SearchResults {
  results: Map<string, number>;
  pages: {
    total: number[];
    visited: number[];
  };
}

const getSearchURL = (q: string, page: number): string =>
  `https://www.google.com/search?q=${encodeURI(q)}&start=${page * 10}&filter=0`;

const walkPaginatedResults = (
  ctx: PuppeteerProviderContext,
  page: Page,
  q: string,
  opts?: {
    stop: number;
  }
): TE.TaskEither<AppError, SearchResults> => {
  const readPages = (
    acc: SearchResults['pages']
  ): TE.TaskEither<AppError, SearchResults['pages']> => {
    return TE.tryCatch(async () => {
      const pagination = await page.$$eval(
        'div[role="navigation"] table td',
        (els) => {
          return els
            .map((el) => el.textContent)
            .map((c) => parseInt(c ?? 'invalid', 10))
            .filter((i) => !isNaN(i));
        }
      );
      ctx.logger.debug('Pages %O', pagination);
      const pages = pagination.filter((p) => !acc.total.includes(p));
      return {
        ...acc,
        total: acc.total.concat(pages),
      };
    }, toAppError);
  };

  const readResults = (
    results: SearchResults['results']
  ): TE.TaskEither<AppError, SearchResults['results']> => {
    return TE.tryCatch(async () => {
      const urls = await page.$$eval('div.yuRUbf a[data-ved]', (els) =>
        els.map((el) => el.getAttribute('href'))
      );

      const updatedAcc = pipe(
        urls,
        A.filter((u): u is string => typeof u === 'string'),
        A.map((u) => {
          if (u.startsWith('https://translate.google.com/translate?')) {
            const url = new URL(u);
            const params = new URLSearchParams(url.search);
            console.log(params);
            return params.get('u') ?? u;
          }
          if (u.startsWith('https://webcache.googleusercontent.com/search?')) {
            const url = new URL(u);
            const params = new URLSearchParams(url.search);
            console.log(params);
            const qURL = params.get('q')?.replace(/cache\:.+?:(.*)/i, '');
            console.log({ qURL });
            return qURL ?? u;
          }
          return u;
        }),
        A.reduce(results, (acc, u) => {
          return pipe(
            acc,
            M.lookup(S.Eq)(u),
            O.fold(
              () => 1,
              (v) => v + 1
            ),
            (o) => M.upsertAt(S.Eq)(u, o)(acc)
          );
        })
      );

      ctx.logger.debug('Results %O', updatedAcc);

      return updatedAcc;
    }, toAppError);
  };

  const loop = (
    q: string,
    p: number,
    acc: SearchResults
  ): TE.TaskEither<AppError, SearchResults> => {
    ctx.logger.debug('Reading results for q: %s ( page %d )', q, p);
    return pipe(
      sequenceS(TE.ApplicativePar)({
        pages: readPages(acc.pages),
        results: readResults(acc.results),
      }),
      TE.chain(({ pages, results }) => {
        const stopAtCurrentPage = opts?.stop === p;

        if (stopAtCurrentPage) {
          ctx.logger.debug(
            'Option given to stop after page %d, returning...',
            p
          );
          return TE.right({
            pages,
            results,
          });
        }

        const lastPage = pages.total[pages.total.length - 1];
        const isLastPage = lastPage <= p;
        if (isLastPage) {
          ctx.logger.debug('Last page %d/%d', lastPage);
          return TE.right({
            pages,
            results,
          });
        }

        return pipe(
          TE.tryCatch(async () => {
            ctx.logger.debug('Navigate to page %d', p + 1);
            const nextPageButton = await page.$(
              `div[role="navigation"] table td a[aria-label="Page ${p + 1}"]`
            );

            await Promise.all([
              page.waitForNavigation({ waitUntil: 'networkidle2' }),
              nextPageButton?.click(),
            ]);
            return undefined;
          }, toAppError),
          TE.chain(() =>
            loop(q, p + 1, {
              pages: {
                ...pages,
                visited: pages.visited.concat(p),
              },
              results,
            })
          )
        );
      })
    );
  };

  return loop(q, 1, {
    results: new Map(),
    pages: {
      total: [],
      visited: [],
    },
  });
};

const run = (): TE.TaskEither<AppError, any> => {
  const q = pipe(process.argv, A.last);
  const opts = undefined;

  return pipe(
    q,
    E.fromOption(
      () =>
        new AppError('Search query not given.', {
          kind: 'ClientError',
          meta: [],
          status: '',
        })
    ),
    E.chain((q) =>
      pipe(
        getChromePath(),
        E.mapLeft(toAppError),
        E.map((chromePath) => ({ chromePath, q }))
      )
    ),
    TE.fromEither,
    TE.chain(({ chromePath, q }) => {
      const ctx = {
        logger: GetLogger('googlesearch'),
        config: {
          ...getDefaultConfig(process.cwd()),
          chromePath,
        },
        hooks: {
          DOMAIN_NAME: '',
          openURL: {
            beforeDirectives: () => Promise.resolve(undefined),
            beforeLoad: () => Promise.resolve(undefined),
            beforeWait: () => Promise.resolve(undefined),
            afterWait: () => Promise.resolve(undefined),
            afterLoad: () => Promise.resolve(undefined),
            completed: () => Promise.resolve(''),
          },
        },
        puppeteer,
      };

      ctx.logger.debug('Puppeteer config %O', ctx.config);

      return pipe(
        GetPuppeteer(ctx).launch({
          args: ['--no-sandbox', '--disabled-setuid-sandbox'],
          executablePath: chromePath,
          headless: false,
        }),
        TE.chain((browser) => {
          return pipe(
            TE.tryCatch(async () => {
              const page = await browser
                .pages()
                .then((p) => p[0] ?? browser.newPage());

              const searchURL = getSearchURL(q, 0);
              ctx.logger.debug('Open search url %s', searchURL);
              await page.goto(searchURL);

              // close cookie modal
              const buttons = await page.$$('button.tHlp8d');
              await buttons[2]?.click();

              // Save a screenshot of the results.
              const resultsCount = await page.$eval('#result-stats', (el) => {
                return el.textContent
                  ?.split(' ')
                  .filter((c) => !isNaN(parseInt(c)))?.[0];
              });

              ctx.logger.debug('Results count %O', resultsCount);

              return { page, resultsCount };
            }, toAppError),
            TE.chain(({ resultsCount, page }) =>
              pipe(
                walkPaginatedResults(ctx, page, q, opts),
                TE.map((out) => {
                  ctx.logger.debug('Output %O', out);
                  ctx.logger.debug('Result keys %O');
                  return {
                    ...out,
                    resultsCount: {
                      expected: resultsCount,
                    },
                  };
                })
              )
            ),
            TE.map(({ results, ...rest }) => ({
              ...rest,
              ...pipe(
                results,
                M.toArray(S.Ord),
                A.reduce(
                  { hosts: {} as any, results: {} as any, count: 0 },
                  (acc, [k, n]) => {
                    const domain = new URL(k);

                    return {
                      count: acc.count + n,
                      hosts: {
                        ...acc.hosts,
                        [domain.hostname]: acc.hosts[domain.hostname]
                          ? acc.hosts[domain.hostname] + n
                          : n,
                      },
                      results: {
                        ...acc.results,
                        [k]: n,
                      },
                    };
                  }
                )
              ),
            })),
            TE.chainFirst(() => TE.tryCatch(() => browser.close(), toAppError)),
            TE.map((output) => {
              fs.writeFileSync(
                path.resolve(process.cwd(), `./out/${encodeURI(q)}.json`),
                JSON.stringify(output, null, 2)
              );
              return output;
            })
          );
        })
      );
    })
  );
};

// eslint-disable-next-line no-console
void run()().then(console.log, console.error);
