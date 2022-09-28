import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { Tooltip } from './../components/Tooltip';

export default {
  title: 'Example/Tooltip',
  component: Tooltip,
} as ComponentMeta<typeof Tooltip>;

const Template: ComponentStory<typeof Tooltip> = (args) => (
  <Tooltip {...args} />
);

export const Basic = Template.bind({});
Basic.args = {
  tooltipText: 'Add your own text here',
};
