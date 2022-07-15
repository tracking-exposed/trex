import * as t from 'io-ts';

export const HealthResponse = t.strict(
  { data: t.literal('OK') },
  'GetHealthResponse'
);

export type HealthResponse = t.TypeOf<typeof HealthResponse>;
