export type Nature = {
  type: 'foryou';
} | {
  type: 'following';
} | {
  type: 'video';
  videoId: string;
  authorId: string;
} | {
  type: 'creator';
  creatorName: string;
} | {
  type: 'search';
  query: string;
  timestamp: string;
};

export default Nature;
