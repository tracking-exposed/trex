import * as t from 'io-ts';
import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';

export const HandshakeBody = t.type(
  {
    config: t.strict(
      {
        publicKey: t.string,
        experimentId: t.union([t.string, t.undefined]),
        execount: t.number,
        newProfile: t.boolean,
        evidencetag: t.union([t.string, t.undefined]),
        directiveType: t.string,
        testTime: DateFromISOString,
      },
      'Config'
    ),
    href: t.string,
  },

  'HandshakeBody'
);

export type HandshakeBody = t.TypeOf<typeof HandshakeBody>;

export const HandshakeResponse = t.strict(
  {
    _id: t.string,
    href: t.string,
    execount: t.union([t.number, t.undefined]),
    newProfile: t.union([t.boolean, t.undefined]),
    testName: t.union([t.string, t.null]),
    publicKey: t.string,
    status: t.literal('active'),
  },
  'HandshakeResponse'
);

export type HandshakeResponse = t.TypeOf<typeof HandshakeResponse>;
