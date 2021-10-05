import { createTheme } from '@material-ui/core/styles';

const pink = '#E33180';

export const YCAITheme = createTheme({
  typography: {
    fontFamily: 'Trex',
    fontWeightRegular: 400,
    fontWeightMedium: 600,
    fontWeightBold: 800,
    // h1: {
    //   fontWeight: 600
    // },
    // h4: {
    //   fontWeight: 600,
    // },
    // h6: {
    //   fontWeight: 600
    // }
  },
  overrides: {
    MuiTabs: {
      root: {
        background: pink,
      },
    },
  },
  palette: {
    primary: {
      light: '#ff5983',
      main: '#f50057',
      dark: '#bb002f',
      contrastText: '#FFFFFF',
    },
  },
});
