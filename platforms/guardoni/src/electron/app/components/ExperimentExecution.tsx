import { GuardoniConfig } from '../../../guardoni/types';
import * as React from 'react';
import { RouteProps } from 'react-router';
import OutputPanel from './OutputPanel';

const ExperimentExecution: React.FC<any> = () => {
  return (
    <div>
      <div>Experiment running...</div>
      <OutputPanel items={[]} />
    </div>
  );
};

const ExperimentExecutionRoute: React.FC<
  RouteProps & { config: GuardoniConfig }
> = () => {
  return <ExperimentExecution />;
};

export default ExperimentExecutionRoute;
