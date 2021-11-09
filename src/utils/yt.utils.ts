export function getVideoId(locationhref: string): string | undefined {
  const p = new URLSearchParams(locationhref.split('?')[1]);
  return p.get('v') ?? p.get('watch') ?? undefined;
}

export const getYTThumbnailById = (id: string): string =>
  `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export const getYTMaxResThumbnailById = (id: string): string =>
  `https://i.ytimg.com/vi_webp/${id}/maxresdefault.webp`;

export const getYTVideoURLById = (id: string): string =>
  `https://youtu.be/${id}`;
