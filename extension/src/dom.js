// # Watch stuff change in the DOM
//
// This module takes care of triggering events when the DOM changes.

function watch(root, selector, callback) {
  // ## `watch(root, selector, callback)`
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

  // debugger;
  const mutationObserver = new MutationObserver(mutations =>
    // Each `mutation` in the `mutations` array contains an...
    mutations.forEach(mutation =>
      // ...array of added nodes. We need to iterate all of the nodes.
      mutation.addedNodes.forEach(
        node =>
          // We analyze each `node`, if it is an `Element` then it implements the `querySelectorAll` interface, that we use to match our `selector`.
          // For each element matching the selector, we finally trigger `callback` with the matching element.
          node instanceof Element &&
          node.querySelectorAll(selector).forEach(element => callback(element))
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
    debugger;
    root.querySelectorAll(selector).forEach(callback);

    debugger;
    // Start observing events on `root`, using the configuration specified. For
    // more information about the configuration parameters, check the
    // [MutationObserverInit
    // documentation](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserverInit).
    mutationObserver.observe(root, {
      childList: true,
      subtree: true
    });
  }, 0);

  return mutationObserver;
}

function on(selector, callback) {
  // debugger;
  return watch(document, selector, callback);
}

function one(selector, callback) {
  // debugger;
  let mutationObserver;
  let once = false;

  const wrapper = element => {
    if (!once) {
      callback(element);
      once = true;
      mutationObserver.disconnect();
    }
  };

  mutationObserver = on(selector, wrapper);
}

module.exports = {
  watch,
  on,
  one
}