import * as t from 'io-ts';

export const ContributorPublicKeyResponse = t.strict(
  {
    success: t.boolean,
    result: t.strict({
      metadata: t.strict({
        acknowledged: t.boolean,
        deletedCount: t.number,
      }),
    }),
  },
  'ContributorPublicKeyResponse'
);

export type ContributorPublicKeyResponse = t.TypeOf<
  typeof ContributorPublicKeyResponse
>;
