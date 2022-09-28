import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Popup from '@shared/extension/popup/components/Popup';

export default {
  title: 'Example/Popup',
  component: Popup,
} as ComponentMeta<typeof Popup>;

const Template: ComponentStory<typeof Popup> = (args) => <Popup {...args} />;

export const Basic = Template.bind({});
Basic.args = {};
