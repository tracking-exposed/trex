import { debounce } from '@material-ui/core';
import { differenceInSeconds } from 'date-fns';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import _ from 'lodash';
import { Endpoint, EndpointInstance } from '../endpoints';
import { Codec, RecordCodec } from 'ts-io-error/Codec';
import { trexLogger } from '../logger';
import {
  ADVContributionEvent,
  VideoContributionEvent,
} from '../models/ContributionEvent';
import { Keypair } from '../models/extension/Keypair';
import { getTimeISO8601 } from '../utils/date.utils';
import { BrowserProvider, MessagesAPI } from './browser.provider';
import bs58Provider from './bs58.provider';

const ddLogger = trexLogger.extend('data-donation');

const consideredURLs = {
  home: /^\/$/,
  video: /^\/watch$/,
  search: /^\/results$/,
  hashtag: /^\/hashtag/,
  feed: /^\/feed/,
  channel: /^\/channel/,
};

export type ContributionState =
  | { type: 'idle' }
  | { type: 'video-wait' }
  | { type: 'video-seen' }
  | { type: 'video-sent' }
  | { type: 'adv-wait' }
  | { type: 'adv-seen' }
  | { type: 'adv-sent' };

type SetState = (s: ContributionState) => void;

export interface CollectedState {
  incremental: number;
  content: Array<VideoContributionEvent | ADVContributionEvent>;
}

interface Command {
  parents?: number;
  selector?: string;
  color?: string;
  preserveInvisible?: boolean;
  screen?: boolean;
}

const observers: MutationObserver[] = [];

const state: CollectedState = {
  incremental: 0,
  content: [],
};

// variable used to spot differences due to refresh and url change
let randomUUID =
  'INIT' +
  Math.random().toString(36).substring(2, 13) +
  Math.random().toString(36).substring(2, 13);

let lastObservedSize = 1;
let leavesCache: Record<string, any> = {};

let collectDataTimer: any;
let flushInterval: any;
let isRunning = false;

export function clearCache(): void {
  leavesCache = {};
  lastObservedSize = 1;
}

function watch(
  root: Document,
  selector: string,
  callback: (el: HTMLElement) => void
): MutationObserver {
  //
  // Watch for changes and do something. Since the DOM can be quite big, the
  // function requires a `root` to select which part of the DOM to observe. Every
  // time a child of the `root` is added, removed, or changed, this function will
  // check if `selector` matches any of the changes. If so, `callback` is
  // triggered using `element` as the only argument.
  //
  // ### Implementation details
  //
  // First we need to instantiate a new
  // [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
  // object. It will be responsible to watch for changes being made in the DOM
  // tree. We initialize it with a callback function that takes an array of
  // mutations. Watch out because things are gonna be _nesty_ here (hehe pun
  // intended).

  const mutationObserver = new MutationObserver((mutations) =>
    // Each `mutation` in the `mutations` array contains an...
    mutations.forEach((mutation) =>
      // ...array of added nodes. We need to iterate all of the nodes.
      mutation.addedNodes.forEach(
        (node) =>
          // We analyze each `node`, if it is an `Element` then it implements the `querySelectorAll` interface, that we use to match our `selector`.
          // For each element matching the selector, we finally trigger `callback` with the matching element.
          node instanceof Element &&
          node
            .querySelectorAll<HTMLElement>(selector)
            .forEach((element) => callback(element))
      )
    )
  );

  // We want this function to trigger `callback` on elements that are already in
  // the DOM. Note that this function works asynchronously, and we expect to
  // start triggering `callback`s after it has been called.
  // To avoid the execution of `callback` to be synchronous, we wrap it
  // in a `setTimeout` with timeout `0` to execute this piece of code in the
  // next event loop.
  setTimeout(() => {
    // Query for all elements and run `callback`.
    root.querySelectorAll<HTMLElement>(selector).forEach(callback);

    // Start observing events on `root`, using the configuration specified. For
    // more information about the configuration parameters, check the
    // [MutationObserverInit
    // documentation](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserverInit).
    mutationObserver.observe(root, {
      childList: true,
      subtree: true,
    });
  }, 0);

  observers.push(mutationObserver);
  return mutationObserver;
}

function addContribution(
  e: VideoContributionEvent | ADVContributionEvent
): void {
  state.content.push(e);
  state.incremental++;
}

function leavesWatcher(
  setState: SetState,
  ctx: DataDonationProviderContext
): void {
  // initialized MutationObserver with the selectors and
  // then a list of functions would handle it
  _.each(ctx.watchedPaths, function (command, selectorName) {
    const cb = _.partial(
      manageNodes,
      command,
      selectorName,
      debounce(setState, 1000),
      ctx.debug
    );
    watch(document, command.selector, cb);
  });
}

const getOffsetLeft = (element: HTMLElement | null): number => {
  let offsetLeft = 0;
  while (element !== null) {
    offsetLeft += element.offsetLeft;
    element = element.offsetParent as HTMLElement;
  }
  return offsetLeft;
};

const getOffsetTop = (element: HTMLElement | null): number => {
  let offsetTop = 0;
  while (element !== null) {
    offsetTop += element.offsetTop;
    element = element.offsetParent as HTMLElement;
  }
  return offsetTop;
};

export function sizeCheck(nodeHTML: string): boolean {
  // this function look at the LENGTH of the proposed element.
  // this is used in video because the full html body page would be too big.
  const s = _.size(nodeHTML);

  // this is the minimum size worthy of reporting
  if (s < 100000) {
    ddLogger.debug('HTML too small to consider!', s);
    return false;
  }

  // check if the increment is more than 4%, otherwise is not interesting
  const percentile = 100 / s;
  const percentage = _.round(100 - percentile * lastObservedSize, 2);

  ddLogger.info(
    `HTML size (${s}) difference since last observed size +${percentage}%`
  );

  if (percentage < 5) {
    ddLogger.debug(
      `Skipping update as ${percentage}% of the page is already sent (size ${s}, lastObservedSize ${lastObservedSize}) ${window.location.pathname}`
    );
    return false;
  }

  ddLogger.info(
    `Valid update as a new %d% of the page have been received (size %d, lastObservedSize %d) %s`,
    percentage,
    s,
    lastObservedSize,
    window.location.pathname
  );
  lastObservedSize = s;
  return true;
}

function manageNodes(
  command: Command,
  selectorName: string,
  setState: SetState,
  showDebugUI: boolean,
  selected: HTMLElement
): void {
  // command has .selector .parents .preserveInvisible (this might be undefined)

  const offsetTop = getOffsetTop(selected);
  const offsetLeft = getOffsetLeft(selected);
  const isVisible = offsetTop + offsetLeft > 0;
  if (command.preserveInvisible !== true) {
    if (!isVisible) {
      // ddLogger.debug('Ignoring invisible node: %O', selectorName);
      return;
    }
  }

  // highligh collected fragments in development
  if (showDebugUI) {
    const stroke = '3px';
    const color = command.color ?? 'red';
    selected.style.border = `${stroke} solid ${color}`;
    selected.setAttribute(selectorName, 'true');
    selected.setAttribute('yttrex', '1');
  } else {
    selected.style.border = 'none';
    selected.removeAttribute(selectorName);
    selected.removeAttribute('yttrex');
  }

  // if escalation to parents, highlight with different color
  if ((command.parents ?? 0) > 0) {
    selected = _.reduce(
      _.times(command.parents ?? 0),
      (memo) => {
        // console.log("collecting parent", selectorName, memo.tagName, memo.parentNode.tagName);
        return memo.parentNode as HTMLElement;
      },
      selected
    );
  }

  if (command.screen === true) {
    // no screencapture capability in the extension
  }
  const html = selected.outerHTML;
  const hash = html.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  if (leavesCache[hash] !== undefined) {
    /* ddLogger.debug(
      'Element cached, not saving it (%s) via selector %s: %O',
      hash, selectorName, leavesCache[hash]); */
    leavesCache[hash]++;
    return;
  }
  // most of the time this doesn't happens: duplication are many!
  // is debug-worthy remove the 'return' and send cache counter.

  leavesCache[hash] = 1;
  // as it is the first observation, take infos and send it
  const acquired: ADVContributionEvent = {
    experimentId: undefined,
    researchTag: undefined,
    type: 'leaf',
    html,
    hash,
    offsetTop,
    offsetLeft,
    href: window.location.href,
    selectorName,
    randomUUID,
    incremental: state.incremental,
    clientTime: getTimeISO8601(),
  };

  addContribution(acquired);

  setState({ type: 'adv-seen' });
}

function processableURL(validURLs: object, location: Location): string | null {
  return _.reduce(
    validURLs,
    (memo, matcher, name) => {
      if (memo !== null) return memo;

      if (location.pathname.match(matcher) !== null) {
        return name;
      }

      return memo;
    },
    ''
  );
}

interface DataDonationProvider {
  boot: (keypair: Keypair, setState: SetState) => void;
  flush: (keypair: Keypair) => void;
  clear: (keypair: Keypair) => void;
}

interface DataDonationProviderContext {
  browser: BrowserProvider<MessagesAPI<any>>;
  version: string;
  debug: boolean;
  flushInterval?: number;
  watchedPaths: Record<
    string,
    {
      selector: string;
      color?: string;
      parents?: number;
    }
  >;
  addEvent: EndpointInstance<
    Endpoint<
      'POST',
      Codec<any, any, any>,
      RecordCodec<any, any, any>,
      undefined,
      Codec<any, any, any>,
      undefined
    >
  >;
}

export const GetDataDonationProvider = (
  ctx: DataDonationProviderContext
): DataDonationProvider => {
  const FLUSH_INTERVAL = process.env.DATA_DONATION_FLUSH_INTERVAL
    ? parseInt(process.env.DATA_DONATION_FLUSH_INTERVAL, 10)
    : 5000;
  // Boot the user script. This is the first function called.
  // Everything starts from here.
  const boot = (keypair: Keypair, setState: SetState): void => {
    if (isRunning) {
      ddLogger.debug('Already running, returning...');
      return;
    }
    isRunning = true;
    // this get executed on pornhub.com and it is the start of potrex extension
    ddLogger.debug('Version %s', ctx.version);

    // register flush timer

    flushInterval = setInterval(() => {
      flush(keypair);
    }, FLUSH_INTERVAL);

    collectDataTimer = setInterval(function () {
      const urlIsNew = window.location.href !== lastVideoURL;
      ddLogger.debug(
        `Last url %s, current url %s, is different %s`,
        lastVideoURL,
        window.location.href,
        urlIsNew
      );

      // client might duplicate the sending of the same
      // video. using a random identifier, we spot the
      // clones and drop them server side.
      // also, here is cleaned the cache declared below
      if (urlIsNew) {
        // Considering the extension only runs on *.youtube.com
        // we want to make sure the main code is executed only in
        // website portion actually processed by us. If not, the
        // blink maker would blink in BLUE.
        // This code is executed by a window.setInterval because
        // the location might change
        const urlToProcess = processableURL(consideredURLs, window.location);

        if (urlToProcess === null) {
          setState({ type: 'video-wait' });
          return null;
        }

        setState({ type: 'video-seen' });
        lastVideoURL = window.location.href;
        clearCache();
        refreshUUID();
      }

      const sendableNode = document.querySelector('ytd-app');

      if (sendableNode === null || !sizeCheck(sendableNode.outerHTML)) return;

      addContribution({
        researchTag: undefined,
        experimentId: undefined,
        type: 'video',
        element: sendableNode.outerHTML,
        size: sendableNode.outerHTML.length,
        href: window.location.href,
        randomUUID,
        incremental: state.incremental,
        clientTime: getTimeISO8601(),
      });
      setState({ type: 'video-sent' });
    }, videoPeriodicTimeout);

    leavesWatcher(setState, ctx);
  };

  const videoPeriodicTimeout = 5000;
  let lastVideoURL: string;

  let lastCheck: Date;
  const REFERENCE = 3;
  function refreshUUID(): void {
    ddLogger.debug(`Refreshing the UUID with last check %s`, lastCheck);
    if (lastCheck !== undefined) {
      const timed = differenceInSeconds(new Date(), lastCheck);
      ddLogger.debug(`Time elapsed %s`, timed);
      if (timed > REFERENCE) {
        // here is an example of a non secure random generation
        // but doesn't matter because the query on the server we
        // has this with the user publicKey, so if someone wants to
        // corrupt their data: they can ¯\_(ツ)_/¯
        randomUUID =
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15);
        ddLogger.debug('Refreshed randomUUID %s', randomUUID);
      } else {
        ddLogger.debug('Keep last randomUUID.');
      }
    }
    lastCheck = new Date();
  }

  const flush = (keypair: Keypair): void => {
    if (state.content.length > 0) {
      const uuids = _.size(_.uniq(_.map(state.content, 'randomUUID')));
      ddLogger.debug(
        'sync tot (%d)/(%d) %O with %O randomUUID(s)',
        state.content.length,
        state.incremental,
        state.content,
        uuids
      );

      void pipe(
        bs58Provider.makeSignature(state.content, keypair.secretKey),
        TE.chain((signature) =>
          ctx.browser.sendAPIMessage(ctx.addEvent)({
            Headers: {
              'X-YTtrex-Build': ctx.version,
              'X-YTtrex-Version': ctx.version,
              'X-YTtrex-PublicKey': keypair.publicKey,
              'X-YTtrex-Signature': signature,
            },
            Body: state.content,
          })
        ),
        // eslint-disable-next-line array-callback-return
        TE.map(() => {
          state.content = [];
        })
      )();
    }
  };

  const clear = (keypair: Keypair): void => {
    flush(keypair);
    observers.forEach((o) => o.disconnect());
    clearCache();
    clearInterval(flushInterval);
    clearInterval(collectDataTimer);
    isRunning = false;
    ddLogger.debug(`Cleared all cache and timers.`);
  };

  return { boot, flush, clear };
};
