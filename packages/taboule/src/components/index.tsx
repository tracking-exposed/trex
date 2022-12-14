import { TabouleConfiguration } from '../config';
import React from 'react';
import { TabbedTaboule } from './TabbedTaboule';
import { Taboule, TabouleProps } from './Taboule';

export interface TabouleIndexProps<Q extends keyof TabouleConfiguration>
  extends Omit<TabouleProps<Q>, 'query'> {
  queries?: Array<{ value: Q; label: string }>;
}

export const TabouleIndex = <Q extends keyof TabouleConfiguration>({
  queries,
  ...props
}: TabouleIndexProps<Q>): JSX.Element => {
  return !queries ? (
    <div>Define a query to display data in this Taboule.</div>
  ) : queries.length > 1 ? (
    <TabbedTaboule {...props} queries={queries} />
  ) : (
    <Taboule {...props} query={queries[0].value} />
  );
};
