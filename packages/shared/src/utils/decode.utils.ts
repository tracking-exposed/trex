import bs58 from 'bs58';

export function decodeString(s: string): Uint8Array {
  // Credits: https://github.com/dchest/tweetnacl-util-js
  const d = unescape(encodeURIComponent(s));
  const b = new Uint8Array(d.length);

  for (let i = 0; i < d.length; i++) {
    b[i] = d.charCodeAt(i);
  }
  return b;
}

export function decodeFromBase58(key: string): Uint8Array {
  return new Uint8Array(bs58.decode(key));
}

export function encodeToBase58(s: Uint8Array): string {
  return bs58.encode(s);
}
