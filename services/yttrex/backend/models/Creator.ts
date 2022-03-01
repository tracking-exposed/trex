import * as t from 'io-ts';

export const Creator = t.strict({

}, 'CreatorDB');

export type Creator = t.TypeOf<typeof Creator>