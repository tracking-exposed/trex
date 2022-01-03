import Nature from './Nature';

interface Music {
  url: string;
  name: string;
}

interface Author {
  link: string;
  name: string;
  username: string;
}

interface Metrics {
  liken: string;
  commentn: string;
  sharen: string;
}

export interface MetaDataBase {
  type: Nature['type'];
}

export interface VideoMetaDataBase extends MetaDataBase {
  type: VideoMetaData['type'];
  author: Author;
  baretext: string;
  description: string;
  hashtags: string[];
  metrics: Metrics;
}

export interface ForYouVideoMetaData extends VideoMetaDataBase {
  type: 'foryou';
  music: Music;
}

export interface FollowingVideoMetaData extends VideoMetaDataBase {
  type: 'following';
  music: Music;
}

export interface SearchVideoMetaData extends VideoMetaDataBase {
  type: 'search';
}

type VideoMetaData =
  ForYouVideoMetaData | SearchVideoMetaData |
  FollowingVideoMetaData;

export type MetaData = VideoMetaData;

export default MetaData;
