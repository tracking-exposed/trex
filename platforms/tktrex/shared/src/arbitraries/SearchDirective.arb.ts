import fc from 'fast-check';
import { getArbitrary } from 'fast-check-io-ts';
import { HumanReadableStringArb } from '@shared/arbitraries/HumanReadableString.arb';
import { URLArb } from '@shared/arbitraries/URL.arb';
import { SearchDirective } from '../models/directive/SearchDirective';

export const SearchDirectiveArb = getArbitrary(SearchDirective).map((r) => ({
  ...r,
  title: fc.sample(HumanReadableStringArb())[0],
  url: fc.sample(URLArb, 1)[0],
  videoURL: fc.sample(URLArb, 1)[0],
}));
