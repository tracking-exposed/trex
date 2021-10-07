import * as t from "io-ts";

export const AuthResponse = t.strict(
  {
    token: t.string,
    verified: t.boolean,
  },
  "AuthResponse"
);

export type AuthResponse = t.TypeOf<typeof AuthResponse>
