import fc from 'fast-check';
import { getArbitrary } from 'fast-check-io-ts';
import * as t from 'io-ts';
import { HandshakeResponse } from '../models/HandshakeBody';

const { status, ...handshakeActiveResponseProps } =
  HandshakeResponse.types[0].type.props;

export const HandshakeActiveResponseArb = getArbitrary(
  t.strict({ ...handshakeActiveResponseProps })
).map((r) => ({
  ...r,
  status: 'active',
  since: new Date().toISOString(),
}));

const handshakeIgnoredResponseProps = HandshakeResponse.types[1].props;

export const HandshakeIgnoredResponseArb = getArbitrary(
  t.strict({ ...handshakeIgnoredResponseProps })
);

export const HandshakeResponseArb = fc.oneof(
  HandshakeActiveResponseArb,
  HandshakeIgnoredResponseArb
);
