import * as React from 'react';
import renderer from 'react-test-renderer';
import { Dashboard } from '../Dashboard';

describe('Dashboard', () => {
  test('Should mount the dashboard', () => {
    const component = renderer.create(<Dashboard />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
