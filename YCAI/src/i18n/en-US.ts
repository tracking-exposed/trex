import { CustomTypeOptions } from 'react-i18next';

const resources: CustomTypeOptions['resources'] = {
  title: 'YouChoose AI',
  common: {
    title: 'YouChoose AI',
    description: 'YouChoose the recommendation model',
    coming_soon: 'Coming soon',
    empty_list: 'No {{resource}} found.',
    empty_string: '',
  },
  actions: {
    popup_bootstrap: 'Bootstrap',
    add: 'Add',
    copied: 'Copied!',
    drag_drop_recommendations:
      'Drag and drop to change the order of appearance',
    manage_recommendations: 'Manage recommendations',
    link_channel: 'Link channel',
    unlink_channel: 'Unlink Channel',
    unlink_channel_confirm_text:
      'Are you sure you want to unlink your channel from the YouChoose extension?\nYour recommendations will remain visible on the YouChoose platform.',
    unlink_channel_confirm_no: 'No, stay signed-in',
    unlink_channel_confirm_yes: 'Yes, unlink my channel',
    delete: 'Delete',
    clear: 'Clear',
    editThisVideo: 'Edit this video',
    importVideos: 'Import videos',
    addToCurrentVideo: 'Add to current video',
    compare: 'Compare',
    related: 'Related',
    next: 'Next',
    verify_channel: 'Verify',
    generate_keypair: 'Generate keypair',
    refresh_keypair: 'Refresh keypair',
    delete_keypair: 'Delete keypair',
    download_keypair: 'Download keypair',
    pull_creator_videos: 'Import your videos',
    update_creator_videos_list: 'Refresh',
    copy_verification_code: 'Copy code',
    unlink_profile: 'Unlink profile',
    edit_access_token: 'Edit Access Token',
    save_access_token: 'Save Access Token',
    download_access_token: 'Download Access Token',
    download: 'Download',
    move_recommendation_up: 'Move recommendation up',
    move_recommendation_down: 'Move recommendation down',
    delete_recommendation_button: 'Delete',
    edit_recommendation_form_title: 'Edit recommendation',
    edit_recommendation_button: 'Edit',
    edit_recommendation_description:
      'Explain briefly why you found this content relevant for your audience',
    cancel: 'Cancel',
    save: 'Save',
    manage_tokens: 'Manage tokens',
    reset_settings: 'Reset settings',
    reload_extension: 'Reload extension',
  },
  errors: {
    an_error_occurred: 'An error occurred',
  },
  routes: {
    lab_title: 'LAB - Choose the Recommendations on Your Videos',
    lab_title_short: 'LAB',
    lab_subtitle:
      'Click on a video to pick its recommendations.\nYour content, your choice!',
    lab_edit_subtitle:
      'Paste a link in the grey box below to add it to the recommendations of this video.\nYou can add recommendations towards any website!',
    recommendations_library_title_short: 'Recommendations',
    recommendations_library_subtitle: 'Recommendations Library',
    recommendations_library_title:
      'All the recommendations added by you will be linked to your videos',
    analytics: 'Analytics',
    settings: 'Settings',
    link_account:
      'Authenticate your Channel \n to start recommending on your videos',
  },
  account: {
    channel: 'Your channel URL or ID',
  },
  creator: {
    title: 'Creator',
  },
  hide_all: {
    title: 'Hide All',
  },
  link_account: {
    title: 'Authenticate your YouTube channel.',
    subtitle:
      'Follow these 2 steps in 1 min to start choosing recommendations on your videos:',
    label: 'Authenticate your YouTube channel',
    copy_verification_key:
      'Copy paste this unique code in your channel description',
    verification_code_hint:
      "<1>Click here to edit your channel description</1> from YouTube Studio.\n\nPaste the code anywhere in the description and click 'publish' on the top right.\n\nYou can remove this code after the verification is finished.",
    paste_channel_url: '- Paste the URL or ID of your YouTube Channel:',
    verification_failed: 'Oops, the channel authentication failed!',
    verification_failed_hint:
      'Please check that you have published the code\nin your channel description and try again.',
    go_back_to_step_one_hint:
      'If the verification keeps failing, <1>click CLEAR</1> and make sure\nyou have pasted the correct URL of your YouTube channel.',
    channel_not_found:
      "We couldn't find a channel with the ID you provided.\nPlease make sure the URL or ID you pasted is correct.",
    already_have_token:
      'Or <1>click here</1> if you already have an access token.',
    token_modal_title: 'Authenticate with an access token',
    token_modal_description:
      'If you already have an access token, paste it below:',
    token_modal_submit: 'Authenticate',
    token_authentication_failed:
      'Authentication failed, please check your access token.',
  },
  youtube: {
    title: 'Youtube',
  },
  recommendations: {
    added_to_video_title: 'Recommendations added',
    by_creator_title: "Author's recommendations",
    total: 'Total recommendations',
    url: 'Recommendation URL',
    yours: 'Your recommendations',
    no_items: 'Recommendations will appear here once added!',
    add_to_video: 'Add a recommendation to this video',
    url_placeholder: 'http://...',
    url_helper_text: 'Insert a link',
    title: 'Recommendation title',
    description: 'Recommendation description',
    missing_description: 'This recommendation does not have a description.',
  },
  dashboard: { title: 'Youchoose Creator Studio' },
  popup: { version: 'version {{version}} build {{date}}' },
  analytics: {
    subtitle: 'Statistics computed thanks to user data donations',
    recommendability_score_title: 'Recommendability Score',
    recommendability_score_subtitle:
      'How much does YouTube promote your content?',
    recommendations_title: 'Recommendations Analyzed',
    recommendations_for_other_channels: 'From other channels',
    total_recommendations: 'Total recommendations',
    total_metadata: 'Total metadata',
    notifications_title: 'Notifications',
    top_n_cc_related_to_your_channel:
      'Most recommended channels on your videos:',
    advertising_connected_to_your_videos_title: 'Advertising',
    advertising_connected_to_your_videos_subtitle: 'Ads ran on your videos',
    advertising_empty_data: 'No advertising data collected yet on your channel',
  },
  videos: {
    no_results: 'No videos found.',
    no_selected: 'No video selected',
    no_video_id: 'No video id found',
  },
  settings: {
    contentCreatorRecommendationLabel: 'Enhance Youtube experience',
    contentCreatorRecommendationHint:
      'Show YouChoose pop in the YouTube sidebar',
    communityRecommendationsLabel: 'Community',
    communityRecommendationsHint: 'Coming soon 🌻',
    contributeToIndependentStatsLabel: 'Donate Anonymous Data',
    contributeToIndependentStatsHint:
      'Share data about Youtube to help understand the AI',
    contributeToIndependentStatsShowUILabel: 'UI highlight for donation',
    contributeToIndependentStatsShowUIHint:
      'Highlight the UI of collected and donated elements',
    api_list_title: 'API List',
    encrypted_contributions_private_key:
      'You can download your private key in dashboard.',
    keypair_passphrase: 'Key pair passphrase',
    keypair_private_key: 'Key pair secret key',
    keypair_public_key: 'Key pair public key',
    keypair_title: 'Keypair for independent contribution',
    keypair_description:
      'These are the secure cryptographic keys that are used to encrypt the data that you share with YouChoose.\nOnly you have access to the secret key and without it nobody can link together the information you share.',
    access_token_title: 'Your access token',
    access_token_description:
      'This access token allows this browser to access your profile on YouChoose.\nYou can share it with team-members to give them access to the YouChoose dashboard.',
    access_token: 'Access Token',
    data_donation_learn_more: 'Learn more',
    nudge_donation_opt_in:
      'Please consider donating anonymous data to help us understand the YouTube algorithm.',
    nudge_learn_more: 'Learn more.',
    nudge_not_now: 'Not now',
    nudge_agree: 'I agree',
  },
  ytVideoPage: {
    firstTab: 'Creator Recommendations',
    secondTab: 'Community Recommendations',
    thirdTab: 'Youtube Recommendations',
    distractionFree: 'Enjoy a distraction-free experience',
    noCCRecommendations:
      'This creator has not uploaded customized recommendations yet. If you own this channel, you can do it <1>here</1>.',
  },
  swagger: {
    title: 'The YouChoose AI API workbench',
    description:
      'In this section dedicated to developers you can explore and try out all of the API routes used by YouChoose.<br>You can use these APIs outside of YouChoose as you please.',
  },
};

export default resources;
