import 'react-i18next';

declare module 'react-i18next' {
  export interface CustomTypeOptions {
    resources: {
      title: string;
      recommendations: {
        total: string
      }
      dashboard: {
        title: string
      },
      popup: {
        version: string;
      },
      statistics: {
        title: string
      },
      settings: {
        contentCreatorRecommendationLabel: string;
        contentCreatorRecommendationHint: string;
        communityRecommendationsLabel: string;
        communityRecommendationsHint: string;
        contributeToIndipendentStatsLabel: string;
        contributeToIndipendentStatsHint: string;
      }
    };
  }
}
