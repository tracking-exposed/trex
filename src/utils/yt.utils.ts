export function getVideoId(locationhref: string): string | undefined {
  const p = new URLSearchParams(locationhref.split('?')[1]);
  return p.get('v') ?? undefined;
}
