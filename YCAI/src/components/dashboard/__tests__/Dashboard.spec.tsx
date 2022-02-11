import React from 'react';
import renderer from 'react-test-renderer';
import { Dashboard } from '../Dashboard';
import '../../../i18n';
import { ThemeProvider } from '@material-ui/core';
import { YCAITheme } from '../../../theme';

describe('Dashboard', () => {
  test('Should mount the dashboard', () => {
    const component = renderer.create(
      <ThemeProvider theme={YCAITheme}>
        <Dashboard />
      </ThemeProvider>
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
