import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Popup from '@shared/extension/popup/components/Popup';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ytLogo = require('../../../yttrex/extension/public/yttrex-logo.png');

const Meta: ComponentMeta<typeof Popup> = {
  title: 'Example/Popup',
  component: Popup,
};

export default Meta;

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
