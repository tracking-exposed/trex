import { ComponentMeta, ComponentStory } from '@storybook/react';
import ExpandView from '@taboule/components/expand-view/ExpandView';
import { ParsedInfoArb } from '@yttrex/shared/arbitraries/Metadata.arb';
import * as fc from 'fast-check';

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
  data: fc.sample(ParsedInfoArb, 4).map((r, i) => ({
    ...r,
    order: i,
    thumbnailHref: `http://placekitten.com/600/${i}00`,
  })),
};
