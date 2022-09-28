import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { Tooltip } from './../components/Tooltip';

const Meta: ComponentMeta<typeof Tooltip> = {
  title: 'Example/Tooltip',
  component: Tooltip,
};

export default Meta;

const Template: ComponentStory<typeof Tooltip> = (args) => (
  <Tooltip {...args} />
);

export const Basic = Template.bind({});
Basic.args = {
  tooltipText: 'Add your own text here',
};
