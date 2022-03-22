import geoip from 'geoip-lite';

export const geo = (ip: string): null | { country: string, city: string } => {
  const maybeLookup = geoip.lookup(ip);
  if (!maybeLookup) return null;
  const { country, city } = maybeLookup;
  return { country, city };
};
