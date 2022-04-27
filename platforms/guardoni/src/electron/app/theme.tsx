import { createTheme } from '@material-ui/core';
import './global.css';

const primaryColor = '#23AA9A';
const black = '#000000';

export const theme = createTheme({
  typography: {
    fontSize: 16,
    fontFamily: 'Trex',
    fontWeightRegular: 400,
    fontWeightMedium: 600,
    fontWeightBold: 800,
    h1: {
      fontWeight: 800,
      fontSize: '4rem',
      marginBottom: 32,
    },
    h2: {
      fontWeight: 800,
      fontSize: '3.6rem',
      marginBottom: 16,
    },
    h3: {
      fontWeight: 800,
      fontSize: '1.8rem',
      marginBottom: 10,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.6rem',
      marginBottom: 8,
    },
    h5: {
      fontWeight: 800,
      fontSize: '1.3rem',
    },
    h6: {
      fontWeight: 400,
      fontSize: '1.1rem',
      marginBottom: 4,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 300,
      lineHeight: 1.4,
      marginBottom: 20,
    },
    subtitle2: {
      fontSize: '0.9rem',
      fontWeight: 800,
      lineHeight: 1.1,
    },
    body1: {
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.1,
      color: black,
    },
    body2: {
      fontWeight: 400,
      fontSize: '0.8rem',
      lineHeight: 1.2,
    },
    caption: {
      fontSize: '0.7rem',
      lineHeight: 1.3,
    },
  },
  palette: {
    primary: {
      main: primaryColor,
    },
  },
});
