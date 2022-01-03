import Nature from './Nature';

interface Music {
  url: string;
  name: string;
}

interface Author {
  link: string;
  username: string;
}

interface AuthorWithName extends Author {
  name: string;
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
  baretext: string;
  description: string;
  hashtags: string[];
  metrics: Metrics;
}

export interface ForYouVideoMetaData extends VideoMetaDataBase {
  type: 'foryou';
  author: AuthorWithName;
  music: Music;
}

export interface FollowingVideoMetaData extends VideoMetaDataBase {
  type: 'following';
  author: AuthorWithName;
  music: Music;
}

export interface SearchVideoMetaData extends VideoMetaDataBase {
  type: 'search';
  author: Author;
}

type VideoMetaData =
  ForYouVideoMetaData | SearchVideoMetaData |
  FollowingVideoMetaData;

export type MetaData = VideoMetaData;

export default MetaData;
