import 'react-i18next';

declare module 'react-i18next' {
  export interface CustomTypeOptions {
    resources: {
      title: string;
      common: {
        coming_soon: string;
        empty_list: string;
      };
      actions: {
        add: string;
        delete: string;
        clear: string;
        editThisVideo: string;
        importVideos: string;
        addToCurrentVideo: string;
        removeFromCurrentVideo: string;
        compare: string;
        related: string;
        link_channel: string;
        unlink_channel: string;
        verify_channel: string;
        verify_channel_hint: string;
      };
      account: {
        channel: string;
        channelVideos: string;
      };
      creator: {
        title: string;
      };
      link_account: {
        title: string;
        subtitle: string;
        label: string;
      };
      youtube: {
        title: string;
      };
      recommendations: {
        title: string;
        total: string;
        url: string;
        yours: string;
        add_to_video: string;
        no_items: string;
        url_placeholder: string;
        url_helper_text: string;
      };
      dashboard: {
        title: string;
      };
      popup: {
        version: string;
      };
      statistics: {
        title: string;
        subtitle: string;
        recommendability_score_title: string;
        recommendability_score_subtitle: string;
        unique_watchers: string;
        evidences_title: string;
        notifications_title: string;
        top_n_cc_related_to_your_channel: string;
        advertising_connected_to_your_videos: string;
      };
      settings: {
        contentCreatorRecommendationLabel: string;
        contentCreatorRecommendationHint: string;
        communityRecommendationsLabel: string;
        communityRecommendationsHint: string;
        contributeToIndipendentStatsLabel: string;
        contributeToIndipendentStatsHint: string;
        api_list_title: string
        encrypted_contributions_private_key: string;
      };
      videos: {
        no_results: string;
        no_selected: string;
        no_video_id: string;
      };
      ytVideoPage: {
        firstTab: string;
        secondTab: string;
        thirdTab: string;
      };
      routes: {
        studio: string;
        statistics: string;
        settings: string;
        link_account: string;
      };
    };
  }
}
