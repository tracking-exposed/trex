import * as t from 'io-ts';

export const Supporter = t.strict({

}, 'SupporterDB');

export type Supporter = t.TypeOf<typeof Supporter>