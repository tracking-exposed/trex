import ttFrenchElections from '@TikTok/experiment/french-elections';

export const descriptors = [
  ttFrenchElections,
];

export const experimentTypes = descriptors.map(
  (d) => d.experimentType,
);

export default descriptors;
