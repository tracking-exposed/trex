// # Watch stuff change in the DOM
//
// This module takes care of triggering events when the DOM changes.

export type Callback = (node: HTMLElement) => void;

const htmlElement = (cb: Callback) => (node: Node) => {
  if (node instanceof HTMLElement) {
    cb(node);
  }
};

export function watch(
  root: HTMLElement | Document,
  selector: string,
  callback: Callback
): MutationObserver {
  // ## `watch(root, selector, callback)`
  //
  // Watch for changes and do something. Since the DOM can be quite big, the
  // function requires a `root` to select which part of the DOM to observe. Every
  // time a child of the `root` is added, removed, or changed, this function will
  // check if `selector` matches any of the changes. If so, `callback` is
  // triggered using `HTMLElement` as the only argument.
  //
  // ### Implementation details
  //
  // First we need to instantiate a new
  // [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
  // object. It will be responsible to watch for changes being made in the DOM
  // tree. We initialize it with a callback function that takes an array of
  // mutations. Watch out because things are gonna be _nesty_ here (hehe pun
  // intended).

  // debugger;
  const mutationObserver = new MutationObserver((mutations) => {
    // Each `mutation` in the `mutations` array contains an...
    // mutations.forEach((mutation) => {
    window.document?.querySelectorAll(selector).forEach(htmlElement(callback));
    // });
  });

  // We want this function to trigger `callback` on HTMLElements that are already in
  // the DOM. Note that this function works asynchronously, and we expect to
  // start triggering `callback`s after it has been called.
  // To avoid the execution of `callback` to be synchronous, we wrap it
  // in a `setTimeout` with timeout `0` to execute this piece of code in the
  // next event loop.
  setTimeout(() => {
    // Query for all HTMLElements and run `callback`.

    // debugger;
    root.querySelectorAll(selector).forEach(htmlElement(callback));

    // debugger;

    // Start observing events on `root`, using the configuration specified. For
    // more information about the configuration parameters, check the
    // [MutationObserverInit
    // documentation](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserverInit).
    mutationObserver.observe(root, {
      childList: true,
      subtree: true,
    });
  }, 0);

  return mutationObserver;
}

export function on(selector: string, callback: Callback): MutationObserver {
  return watch(window.document, selector, callback);
}

export function one(selector: string, callback: Callback): MutationObserver {
  const observer = on(selector, (node: HTMLElement) => {
    observer.disconnect();
    callback(node);
  });

  return observer;
}
