import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import Popup from './../../../../packages/shared/src/extension/popup/components/Popup';

export default {
  title: 'Example/Popup',
  component: Popup,
} as ComponentMeta<typeof Popup>;

const Template: ComponentStory<typeof Popup> = (args) => <Popup {...args} />;

export const Basic = Template.bind({});
