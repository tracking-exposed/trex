import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Taboule } from '@taboule/components/Taboule';

const Meta: ComponentMeta<typeof Taboule> = {
  title: 'Example/Taboule',
  component: Taboule,
  argTypes: {
    showInput: {
      type: 'boolean',
    },
  },
};

export default Meta;

const tkBaseURL = process.env.TK_BE_URL;
const ytBaseURL = process.env.YT_BE_URL;

const Template: ComponentStory<typeof Taboule> = (args) => {
  return <Taboule {...args} />;
};

export const YTPersonalSearches = Template.bind({});
YTPersonalSearches.args = {
  showInput: true,
  baseURL: ytBaseURL,
  query: 'youtubePersonalSearches',
};

export const YTPersonalHomes = Template.bind({});
YTPersonalHomes.args = {
  showInput: true,
  baseURL: ytBaseURL,
  query: 'youtubePersonalHomes',
};

export const YTPersonalVideos = Template.bind({});
YTPersonalVideos.args = {
  showInput: true,
  baseURL: ytBaseURL,
  query: 'youtubePersonalVideos',
};

export const TKPersonalNatives = Template.bind({});
TKPersonalNatives.args = {
  showInput: true,
  baseURL: tkBaseURL,
  query: 'tikTokPersonalNative',
};

export const TKPersonalSearch = Template.bind({});
TKPersonalSearch.args = {
  showInput: true,
  baseURL: tkBaseURL,
  query: 'tikTokPersonalSearch',
};

export const TKPersonalForYou = Template.bind({});
TKPersonalForYou.args = {
  showInput: true,
  baseURL: tkBaseURL,
  query: 'tikTokPersonalForYou',
};

export const TKPersonalProfile = Template.bind({});
TKPersonalProfile.args = {
  showInput: true,
  baseURL: tkBaseURL,
  query: 'tikTokPersonalProfile',
};
