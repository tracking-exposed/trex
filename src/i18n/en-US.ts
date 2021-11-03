import { CustomTypeOptions } from 'react-i18next';

const resources: CustomTypeOptions['resources'] = {
  title: 'YouChoose AI',
  common: {
    coming_soon: 'Coming soon',
    empty_list: 'No {{resource}} found.',
  },
  actions: {
    popup_bootstrap: 'Bootstrap',
    add: 'Add',
    add_recommendations: 'Add recommendations',
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
    delete_keypair: 'Delete keypair',
    download_keypair: 'Download keypair',
    pull_creator_videos: 'Import your videos',
    update_creator_videos_list: 'Update your list of videos',
    copy_verification_code: 'Copy code'
  },
  routes: {
    studio: 'Studio',
    statistics: 'Statistics',
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
  link_account: {
    title: 'Link your account',
    subtitle: 'Our system will verify that you own the channel on this browser',
    label: 'Link your account to start choosing recommendations',
    verification_code_label: 'Verification code',
    verification_code_hint:
      "Copy the code below and add it to your YouTube channel's description",
  },
  youtube: {
    title: 'Youtube',
  },
  recommendations: {
    added_to_video_title: 'Recommendations added',
    by_creator_title: 'Author\'s video recommendations',
    total: 'Total recommendations',
    url: 'Recommendation url',
    yours: 'Your recommendations',
    no_items: 'No recommendations found',
    add_to_video: 'Add a recommendation to this video',
    url_placeholder: 'https://youtube.com/watch?v=xxxxx',
    url_helper_text: 'Insert a link',
  },
  dashboard: { title: 'Dashboard' },
  popup: { version: 'version {{version}} build {{data}}' },
  statistics: {
    title: 'Statistics',
    subtitle: 'Statistics computed with resources from other users',
    recommendability_score_title: 'Recommendability Score',
    recommendability_score_subtitle:
      'Where your videos appears as recommended?',
    total_views: 'Total Views',
    total_recommendations: 'Total Recommendations',
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
    api_list_title: 'API List',
    encrypted_contributions_private_key: 'You can download your private key in dashboard.',
    keypair_passphrase: 'Key pair passphrase',
    keypair_private_key: 'Key pair secret key',
    keypair_public_key: 'Key pair public key',
    keypair_title: 'Keypair for independent contribution'
  },
  ytVideoPage: {
    firstTab: 'Creator Recommendations',
    secondTab: 'Community Recommendations',
    thirdTab: 'Youtube Recommendations',
  },
};

export default resources;
