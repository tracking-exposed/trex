// import  * as React from 'react';
import { Palette } from '@material-ui/core/styles/createPalette';
// import type { Theme } from '@material-ui/core/styles/createTheme';

// declare module '@material-ui/core/styles/createTheme' {
//   export interface Theme {
//     // status: {
//     //   danger: React.CSSProperties['color'];
//     // };
//   }
//   export interface ThemeOptions {
//     // status: {
//     //   danger: React.CSSProperties['color'];
//     // };
//   }
// }

declare module '@material-ui/core/styles/createPalette' {
  interface Palette {
    violet: Palette['primary'];
    yellow: Palette['primary'];
  }

  interface PaletteOptions {
    violet: PaletteOptions['primary'];
    yellow: PaletteOptions['primary'];
  }
}
