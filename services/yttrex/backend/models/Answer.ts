import * as t from 'io-ts';

export const Answer = t.strict({

}, 'AnswerDB');

export type Answer = t.TypeOf<typeof Answer>