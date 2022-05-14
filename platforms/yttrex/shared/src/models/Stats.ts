import * as t from 'io-ts';

export const Stats = t.strict({}, 'StatsDB');

export type Stats = t.TypeOf<typeof Stats>;
