import { createTheme } from '@material-ui/core/styles';

const pink = '#E33180';
const green = '#017374';
const white = "#FFFFFF";

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
    background: {
      default: white
    },
    primary: {
      light: '#FF338F',
      main: '#e33180',
      dark: '#C9065E',
      contrastText: '#FFFFFF',
    },
    secondary: {
      light: green,
      main: green,
      dark: green,
      contrastText: white
    }
  },
});

export type YCAITheme = typeof YCAITheme;
