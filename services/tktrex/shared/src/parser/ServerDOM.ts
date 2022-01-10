import { parseHTML } from 'linkedom';

import { ServerDOMInterface } from './ServerDOMInterface';

export const ServerDOM: ServerDOMInterface = {
  parseHTML: (html: string) =>
    parseHTML(html).document,
};

export default ServerDOM;
