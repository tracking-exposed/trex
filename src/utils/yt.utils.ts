export function getVideoId(locationhref: string): string | undefined {
  const p = new URLSearchParams(locationhref.split('?')[1]);
  return p.get('v') ?? p.get('watch') ?? undefined;
}

export const getYTThumbnailById = (id: string): string =>
  `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
