import * as t from 'io-ts';
import { DirectiveType } from './Directive';

export const GuardoniExperiment = t.strict(
  {
    experimentId: t.string,
    when: t.string,
    directiveType: DirectiveType,
    links: t.array(
      t.type({
        urltag: t.string,
        watchFor: t.union([t.string, t.number, t.null]),
        url: t.string,
      })
    ),
  },
  'GuardoniExperiment'
);
export type GuardoniExperiment = t.TypeOf<typeof GuardoniExperiment>;
