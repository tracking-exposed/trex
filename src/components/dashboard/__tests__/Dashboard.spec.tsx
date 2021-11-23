import React from 'react';
import renderer from 'react-test-renderer';
import { Dashboard } from '../Dashboard';
import '../../../i18n';

describe('Dashboard', () => {
  test('Should mount the dashboard', () => {
    const component = renderer.create(<Dashboard />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
