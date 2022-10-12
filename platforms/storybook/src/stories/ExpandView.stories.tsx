import { ComponentStory, ComponentMeta } from '@storybook/react';
import ExpandView from '@taboule/components/expand-view/ExpandView';
import { mockedExpandableData } from '../mocks/index';

const Meta: ComponentMeta<typeof ExpandView> = {
  title: 'Example/ExpandView',
  component: ExpandView,
  argTypes: { handleHideModal: { action: 'clicked' } },
};

export default Meta;

const Template: ComponentStory<typeof ExpandView> = (args) => {
  return <ExpandView {...args} />;
};

export const Basic = Template.bind({});
Basic.args = {
  isVisible: true,
  data: mockedExpandableData,
};
