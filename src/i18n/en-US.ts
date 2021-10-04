import { CustomTypeOptions } from 'react-i18next';

const resources: CustomTypeOptions['resources'] = {
  title: 'YouChoose AI',
  common: {
    coming_soon: 'Coming soon',
  },
  actions: {
    add: 'Add',
    linkChannel: 'Link channel',
    delete: 'Delete',
    clear: 'Clear',
    editThisVideo: 'Edit this video',
    importVideos: 'Import videos',
    addToCurrentVideo: 'Add to current video',
    removeFromCurrentVideo: 'Remove from current video',
    compare: 'Compare',
    related: 'Related',
  },
  routes: {
    studio: 'Studio',
    community: 'Community',
    settings: 'Settings',
  },
  account: {
    channel: 'Your channel',
    channelVideos: 'Channel Videos',
  },
  creator: {
    title: 'Creator',
  },
  community: {
    title: 'Community',
  },
  youtube: {
    title: 'Youtube',
  },
  recommendations: {
    title: 'Recommendations',
    total: 'Total recommendations',
    url: 'Recommendation url',
    yours: 'Yours recommendations',
    add_to_video: 'Add a recommendation to this video',
    url_placeholder: 'https://youtube.com/watch?v=xxxxx',
    url_helper_text: 'Insert a link'
  },
  dashboard: { title: 'Dashboard' },
  popup: { version: 'version {{version}} build {{data}}' },
  statistics: {
    title: 'Statistics',
  },
  videos: {
    no_results: 'No videos found.',
    no_selected: 'No video selected',
    no_video_id: 'No video id found',
  },
  settings: {
    contentCreatorRecommendationLabel: 'Content Creator Recommendations',
    contentCreatorRecommendationHint: 'See what video author are suggesting',
    communityRecommendationsLabel: 'Community Recommendations',
    communityRecommendationsHint: 'Coming soon',
    contributeToIndipendentStatsLabel: 'Contribute to indipendent stats',
    contributeToIndipendentStatsHint:
      'Donate anonymously what Youtube recommends you',
  },
  collaborativeAnalytics: {
    faq_1_question: 'Which videos are recommended close to yours video?',
    faq_2_question: 'Where your videos appears as recommended?',
    faq_3_question: 'Which advertising get served over your videos?',
    faq_4_question: 'Shadow-banning analysis',
  },
  ytVideoPage: {
    firstTab: 'Creator Raccomendations',
    secondTab: 'Community Raccomendations',
    thirdTab: 'Youtube Raccomenations',
  },
};

export default resources;
