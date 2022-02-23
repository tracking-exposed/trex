import ttFrenchElections from '@TikTok/experiment/french-elections';
import ttObservatory from '@TikTok/experiment/observatory';

export const descriptors = [ttFrenchElections, ttObservatory];

export const experimentTypes = descriptors.map((d) => d.experimentType);

export default descriptors;
