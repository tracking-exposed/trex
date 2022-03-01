import * as t from 'io-ts';

export const Directive = t.strict({

}, 'DirectiveDB');

export type Directive = t.TypeOf<typeof Directive>