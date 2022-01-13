import * as t from 'io-ts';
import { Endpoint } from 'ts-endpoint';

const GetHealth = Endpoint({
  Method: 'GET',
  getPath: () => `/v0/health`,
  Output: t.any,
});

export default {
  Public: {
    GetHealth,
  },
};
