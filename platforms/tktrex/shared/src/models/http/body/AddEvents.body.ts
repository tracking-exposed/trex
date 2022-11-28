import * as t from 'io-ts';
import { ContributionEvent } from '../../contribution';

export const AddEventsBody = t.array(ContributionEvent, 'AddEventsBody');
export type AddEventsBody = t.TypeOf<typeof AddEventsBody>;
