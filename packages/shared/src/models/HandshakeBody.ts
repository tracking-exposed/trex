import * as t from 'io-ts';
import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';

export const HandshakeBody = t.intersection(
  [
    t.type(
      {
        config: t.strict(
          {
            publicKey: t.string,
          },
          'Config'
        ),
        href: t.string,
        execount: t.number,
        newProfile: t.boolean,
      },
      'Required'
    ),
    t.partial(
      {
        experimentId: t.string,
        evidencetag: t.string,
        directiveType: t.string,
        testTime: DateFromISOString,
      },
      'Partial'
    ),
  ],
  'HandshakeBody'
);

export type HandshakeBody = t.TypeOf<typeof HandshakeBody>;

export const HandshakeResponse = t.strict(
  {
    _id: t.string,
    href: t.string,
    execount: t.number,
    newProfile: t.boolean,
    testName: t.union([t.string, t.null]),
    publicKey: t.string,
    status: t.literal('active'),
  },
  'HandshakeResponse'
);

export type HandshakeResponse = t.TypeOf<typeof HandshakeResponse>;
