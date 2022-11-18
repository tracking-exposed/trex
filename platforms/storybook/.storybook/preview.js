import { ThemeProvider } from '@material-ui/core';
import { createTheme } from '@material-ui/core/styles';
import { addDecorator } from '@storybook/react';
import { withThemes } from '@react-theming/storybook-addon';

const theme = createTheme({
  typography: {
    fontFamily: 'Trex-Regular',
  },
});

const providerFn = ({ theme, children }) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

// pass ThemeProvider and array of your themes to decorator
addDecorator(withThemes(null, [theme], { providerFn }));
