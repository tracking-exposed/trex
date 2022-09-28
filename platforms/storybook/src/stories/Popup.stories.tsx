import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Popup from '@shared/extension/popup/components/Popup';

const ytLogo = require('../../../yttrex/extension/public/yttrex-logo.png');

export default {
  title: 'Example/Popup',
  component: Popup,
} as ComponentMeta<typeof Popup>;

const Template: ComponentStory<typeof Popup> = (args) => <Popup {...args} />;

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
