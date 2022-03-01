const s = document.createElement('script');
s.src = chrome.extension.getURL('interceptor.js');
s.onload = function(): void {
  (this as any).remove();
};
(document.head || document.documentElement).appendChild(s);

export {};
