import * as t from 'io-ts';


export const GuardoniExperiment = t.strict(
  {
    experimentId: t.string,
    when: t.string,
    since: t.string,
    status: t.string,
    humanizedWhen: t.string,
    links: t.array(
      t.type({
        urltag: t.string,
        watchFor: t.union([t.string, t.number]),
        url: t.string,
      })
    ),
  },
  'GuardoniExperiment'
);
export type GuardoniExperiment = t.TypeOf<typeof GuardoniExperiment>;
