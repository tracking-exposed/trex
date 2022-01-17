import fc from 'fast-check';
import { HumanReadableStringArb } from './HumanReadableString.arb';

export const URLArb = fc
  .record({
    protocol: fc.oneof(fc.constant('http'), fc.constant('https')),
    domain: HumanReadableStringArb({ joinChar: '.' }),
    extension: fc.oneof(
      fc.constant('com'),
      fc.constant('org'),
      fc.constant('it')
    ),
    segments: HumanReadableStringArb({ joinChar: '/' }),
    query: fc.webQueryParameters(),
  })
  .map(
    ({ protocol, domain, extension, segments, query }) =>
      `${protocol}://${domain.toLocaleLowerCase()}.${extension}/${segments}?${query}` as any
  );
