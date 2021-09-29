import { CustomTypeOptions } from 'react-i18next';

const resources: CustomTypeOptions['resources'] = {
  title: 'YouChoose AI',
  actions: {
    add: 'Add',
    delete: 'Delete',
    clear: 'Clear',
    editThisVideo: 'Edit this video',
    importVideos: 'Import videos',
    addToCurrentVideo: 'Add to current video',
    removeFromCurrentVideo: 'Remove from current video',
    compare: 'Compare',
    related: 'Related',
  },
  account: {
    channel: 'Your channel',
    channelVideos: 'Channel Videos',
  },
  recommendations: {
    title: 'Recommendations',
    total: 'Total recommendations',
    url: 'Recommendation url',
    yours: 'Yours recommendations',
  },
  dashboard: { title: 'Dashboard' },
  popup: { version: 'version {{version}} build {{data}}' },
  statistics: {
    title: 'Statistics',
  },
  videos: {
    no_results: 'No videos found.',
    no_selected: 'No video selected',
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
    faq_3_question: "Which advertising get served over your videos?",
    faq_4_question: "Shadow-banning analysis"
  },
};

export default resources;
