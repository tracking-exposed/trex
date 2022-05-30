import { parseHTML } from 'linkedom';
import child_process from 'child_process';

export interface Profile {
  name: string;
  followerCount: number;
  followingCount: number;
  heartCount: number;
  videoCount: number;
  videos: ProfileVideo[];
}

export interface ProfileVideo {
  id: string;
  desc: string;

  // Note: this appears to be a number of
  // seconds since the epoch.
  createTime: number;

  likes: number;
  shares: number;
  comments: number;
  playCount: number;
}

export const fetchPage = (url: string): string => {
  const curl = child_process.spawnSync('curl', [
    '-A',
    'Mozilla/5.0 (X11; Linux x86_64; rv:60.0) Gecko/20100101 Firefox/81.0',
    url,
  ]);

  if (curl.error) {
    throw curl.error;
  }

  return curl.stdout.toString();
};


export const parsePage = (html: string): Profile => {
  const { document } = parseHTML(html);
  const script = document.getElementById('SIGI_STATE')?.innerText;
  if (!script) {
    throw new Error('No SIGI_STATE found');
  }
  const data = JSON.parse(script);

  const videos = Object.values(data.ItemModule).map((item: any) => ({
    id: item.id,
    desc: item.desc,
    createTime: +item.createTime,
    likes: item.stats.diggCount,
    shares: item.stats.shareCount,
    comments: item.stats.commentCount,
    playCount: item.stats.playCount,
  }));

  const [user, stats]: [string, any] = Object.entries(data.UserModule.stats)[0];

  return {
    name: user,
    followerCount: stats.followerCount,
    followingCount: stats.followingCount,
    heartCount: stats.heartCount,
    videoCount: stats.videoCount,
    videos,
  }
};
