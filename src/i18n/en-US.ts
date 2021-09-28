import { CustomTypeOptions } from 'react-i18next';

const resources: CustomTypeOptions['resources'] = {
  title: 'YouChoose AI',
  recommendations: {
    total: 'Total recommendations',
  },
  dashboard: { title: 'Dashboard' },
  popup: { version: 'version {{version}} build {{data}}' },
  statistics: {
    title: 'Statistics',
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
};

export default resources;
