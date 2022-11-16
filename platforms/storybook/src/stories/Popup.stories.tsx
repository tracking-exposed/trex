import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Popup from '@shared/extension/popup/components/Popup';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ytLogo = require('../../../yttrex/extension/public/yttrex-logo.png');

// define @mui theme for popup
const theme = createTheme({
  typography: {
    fontFamily: 'Trex-Regular',
  },
});

const Meta: ComponentMeta<typeof Popup> = {
  title: 'Example/Popup',
  component: Popup,
};

export default Meta;

const Template: ComponentStory<typeof Popup> = (args) => (
  <ThemeProvider theme={theme}>
    <Popup {...args} />
  </ThemeProvider>
);

export const Basic = Template.bind({});
Basic.args = {
  platform: 'youtube',
  platformURL: 'https://www.youtube.com',
  settings: {
    enabled: {
      researchTag: true,
      experimentId: true,
    },
  },
  logo: ytLogo,
};
