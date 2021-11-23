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
        popup_bootstrap: string;
        add: string;
        copied: string;
        drag_drop_recommendations: string;
        manage_recommendations: string;
        delete: string;
        clear: string;
        editThisVideo: string;
        importVideos: string;
        addToCurrentVideo: string;
        next: string;
        compare: string;
        related: string;
        link_channel: string;
        unlink_channel: string;
        verify_channel: string;
        generate_keypair: string;
        refresh_keypair: string;
        delete_keypair: string;
        download_keypair: string;
        pull_creator_videos: string;
        update_creator_videos_list: string;
        copy_verification_code: string;
        unlink_profile: string;
        edit_access_token: string;
        download_access_token: string;
        download: string;
        move_recommendation_up: string;
        move_recommendation_down: string;
        remove_recommendation_from_video: string;
      };
      account: {
        channel: string;
      };
      link_account: {
        copy_verification_key: string;
        title: string;
        subtitle: string;
        label: string;
        verification_code_hint: string;
        paste_channel_url: string;
        verification_failed: string;
        verification_failed_hint: string;
        go_back_to_step_one_hint: string;
      };
      youtube: {
        title: string;
      };
      hide_all: {
        title: string;
      };
      creator: {
        title: string;
      };
      recommendations: {
        added_to_video_title: string;
        by_creator_title: string;
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
        total_views: string;
        total_recommendations: string;
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
        contributeToIndependentStatsLabel: string;
        contributeToIndependentStatsHint: string;
        api_list_title: string;
        encrypted_contributions_private_key: string;
        keypair_title: string;
        keypair_passphrase: string;
        keypair_public_key: string;
        keypair_private_key: string;
        access_token: string;
        access_token_title: string;
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
        lab_title: string;
        lab_title_short: string;
        lab_subtitle: string;
        lab_edit_subtitle: string;
        statistics: string;
        settings: string;
        link_account: string;
      };
    };
  }
}
