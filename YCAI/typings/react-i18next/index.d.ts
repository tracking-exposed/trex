import 'react-i18next';

declare module 'react-i18next' {
  export interface CustomTypeOptions {
    resources: {
      title: string;
      common: {
        title: string;
        description: string;
        coming_soon: string;
        empty_list: string;
        empty_string: string;
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
        unlink_channel_confirm_text: string;
        unlink_channel_confirm_no: string;
        unlink_channel_confirm_yes: string;
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
        save_access_token: string;
        download_access_token: string;
        download: string;
        move_recommendation_up: string;
        move_recommendation_down: string;
        delete_recommendation_button: string;
        edit_recommendation_form_title: string;
        edit_recommendation_button: string;
        edit_recommendation_description: string;
        delete_gem_confirm_message: string;
        cancel: string;
        save: string;
        manage_tokens: string;
        reset_settings: string;
        reload_extension: string;
      };
      errors: {
        an_error_occurred: string;
      };
      account: {
        channel: string;
      };
      congrats: {
        subtitle: string;
        message: string;
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
        channel_not_found: string;
        already_have_token: string;
        token_modal_title: string;
        token_modal_description: string;
        token_modal_submit: string;
        token_authentication_failed: string;
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
        title: string;
        description: string;
        missing_description: string;
      };
      dashboard: {
        title: string;
      };
      popup: {
        version: string;
      };
      analytics: {
        subtitle: string;
        recommendability_score_title: string;
        recommendability_score_subtitle: string;
        recommendations_title: string;
        recommendations_for_other_channels: string;
        total_recommendations: string;
        total_contributions: string;
        notifications_title: string;
        top_n_cc_related_to_your_channel: string;
        advertising_connected_to_your_videos_title: string;
        advertising_connected_to_your_videos_subtitle: string;
        advertising_empty_data: string;
      };
      settings: {
        contentCreatorRecommendationLabel: string;
        contentCreatorRecommendationHint: string;
        communityRecommendationsLabel: string;
        communityRecommendationsHint: string;
        contributeToIndependentStatsLabel: string;
        contributeToIndependentStatsHint: string;
        contributeToIndependentStatsShowUILabel: string;
        contributeToIndependentStatsShowUIHint: string;
        api_list_title: string;
        encrypted_contributions_private_key: string;
        keypair_title: string;
        keypair_description: string;
        keypair_passphrase: string;
        keypair_public_key: string;
        keypair_private_key: string;
        access_token: string;
        access_token_title: string;
        access_token_description: string;
        data_donation_learn_more: string;
        nudge_donation_opt_in: string;
        nudge_learn_more: string;
        nudge_not_now: string;
        nudge_agree: string;
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
        distractionFree: string;
        noCCRecommendations: string;
      };
      routes: {
        link_account: string;
        congrats: string;
        lab_videos_title: string;
        recommendations_library_title: string;
        recommendations_library_title_short: string;
        recommendations_library_subtitle: string;
        lab_title: string;
        lab_title_short: string;
        lab_subtitle: string;
        lab_edit_subtitle: string;
        analytics: string;
        settings: string;
      };
      swagger: {
        title: string;
        description: string;
      };
    };
  }
}
