import * as t from 'io-ts';
import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';

export const HandshakeBody = t.type(
  {
    config: t.strict({
      publicKey: t.string,
    }),

    href: t.string,
    experimentId: t.string,
    evidencetag: t.string,
    execount: t.string,
    newProfile: t.string,
    testTime: DateFromISOString,
    directiveType: t.string,
  },
  'HandshakeBody'
);

export type HandshakeBody = t.TypeOf<typeof HandshakeBody>;
