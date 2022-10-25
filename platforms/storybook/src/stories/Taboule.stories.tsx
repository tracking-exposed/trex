import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Taboule } from '@taboule/components/Taboule';

const Meta: ComponentMeta<typeof Taboule> = {
  title: 'Example/Taboule',
  component: Taboule,
  argTypes: {},
};

export default Meta;

const Template: ComponentStory<typeof Taboule> = (args) => {
  return <Taboule {...args} />;
};

export const Basic = Template.bind({});
Basic.args = {
  query: 'youtubePersonalSearches',
};
