import * as t from 'io-ts';
import { DirectiveType } from './Directive';

export const ExperimentLink = t.strict(
  {
    title: t.union([t.string, t.undefined]),
    urltag: t.string,
    watchFor: t.union([t.string, t.number, t.null]),
    url: t.string,
  },
  'ExperimentLink'
);
export type ExperimentLink = t.TypeOf<typeof ExperimentLink>;

export const GuardoniExperiment = t.strict(
  {
    experimentId: t.string,
    when: t.string,
    directiveType: DirectiveType,
    links: t.array(ExperimentLink),
  },
  'GuardoniExperiment'
);
export type GuardoniExperiment = t.TypeOf<typeof GuardoniExperiment>;
