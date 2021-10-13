import { CustomTypeOptions } from 'react-i18next';

const resources: CustomTypeOptions['resources'] = {
  title: 'YouChoose AI',
  common: {
    coming_soon: 'Coming soon',
    empty_list: 'No {{resource}} found.',
  },
  actions: {
    add: 'Add',
    link_channel: 'Link channel',
    unlink_channel: 'Unlink channel',
    delete: 'Delete',
    clear: 'Clear',
    editThisVideo: 'Edit this video',
    importVideos: 'Import videos',
    addToCurrentVideo: 'Add to current video',
    removeFromCurrentVideo: 'Remove from current video',
    compare: 'Compare',
    related: 'Related',
    verify_channel: 'Verify channel',
    verify_channel_hint:
      "Copy the code below and add it to your YouTube channel's description",
  },
  routes: {
    studio: 'Studio',
    community: 'Community',
    settings: 'Settings',
    link_account: 'Link your account',
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
    subtitle: 'Statistics computed with resources from other users',
    recommendability_score_title: 'Recommendability Score',
    recommendability_score_subtitle:
      'Where your videos appears as recommended?',
  },
  link_account: {
    title: 'Link your account',
    subtitle: 'Our system will verify that you own the channel on this browser',
    label: 'Link your account to start choosing recommendations',
  },
  youtube: {
    title: 'Youtube',
  },
  recommendations: {
    title: 'Recommendations',
    total: 'Total recommendations',
    url: 'Recommendation url',
    yours: 'Yours recommendations',
    no_items: 'No recommendations found',
    add_to_video: 'Add a recommendation to this video',
    url_placeholder: 'https://youtube.com/watch?v=xxxxx',
    url_helper_text: 'Insert a link',
  },
  dashboard: { title: 'Dashboard' },
  popup: { version: 'version {{version}} build {{data}}' },
  statistics: {
    title: 'Statistics',
    unique_watchers: 'Unique watchers',
    evidences_title: 'Evidences',
    notifications_title: 'Notifications',
    top_n_cc_related_to_your_channel:
      'Top {{count}} CC related to your channel',
    advertising_connected_to_your_videos:
      'Advertising connected to your videos',
  },
  videos: {
    no_results: 'No videos found.',
    no_selected: 'No video selected',
    no_video_id: 'No video id found',
  },
  settings: {
    contentCreatorRecommendationLabel: 'Content Creators',
    contentCreatorRecommendationHint: 'See suggestions by real authors',
    communityRecommendationsLabel: 'Community',
    communityRecommendationsHint: 'Coming soon 🌻',
    contributeToIndipendentStatsLabel: 'Independent stats',
    contributeToIndipendentStatsHint:
      'Donate anonymously what Youtube recommends and advertises you',
  },
  ytVideoPage: {
    firstTab: 'Creator Raccomendations',
    secondTab: 'Community Raccomendations',
    thirdTab: 'Youtube Raccomenations',
  },
};

export default resources;
