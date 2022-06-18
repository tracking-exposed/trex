import * as t from 'io-ts';
import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';
import { StringOrNull } from './common/StringOrNull';

export const HandshakeBody = t.type(
  {
    config: t.strict(
      {
        publicKey: t.string,
        experimentId: t.union([t.string, t.undefined]),
        execount: t.union([t.number, t.undefined]),
        newProfile: t.union([t.boolean, t.undefined]),
        evidencetag: t.union([t.string, t.undefined]),
        directiveType: t.union([t.string, t.undefined]),
        testTime: t.union([DateFromISOString, t.undefined]),
      },
      'Config'
    ),
    href: t.string,
  },

  'HandshakeBody'
);

export type HandshakeBody = t.TypeOf<typeof HandshakeBody>;

export const HandshakeResponse = t.union(
  [
    t.strict({
      _id: t.string,
      href: t.string,
      execount: t.union([t.number, t.undefined]),
      newProfile: t.union([t.boolean, t.undefined]),
      testName: StringOrNull,
      publicKey: t.string,
      status: t.literal('active'),
    }),
    t.type({ ignored: t.boolean }),
    t.null,
  ],
  'HandshakeResponse'
);

export type HandshakeResponse = t.TypeOf<typeof HandshakeResponse>;
