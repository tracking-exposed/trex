import { Meta, Story } from '@storybook/react';
import { TabouleIndex, TabouleIndexProps } from '@taboule/components';

const meta: Meta<TabouleIndexProps<any>> = {
  title: 'Example/Taboule',
  component: TabouleIndex,
  argTypes: {
    showInput: {
      type: 'boolean',
    },
  },
};

export default meta;

const tkBaseURL = process.env.TK_BE_URL;
const ytBaseURL = process.env.YT_BE_URL;

const ytPersonalSearchQ = {
  value: 'youtubePersonalSearches',
  label: 'Personal Searches',
};
const ytPersonalHomeQ = {
  value: 'youtubePersonalHomes',
  label: 'Personal Homes',
};
const ytPersonalVideoQ = {
  value: 'youtubePersonalVideos',
  label: 'Personal Videos',
};

const tkPersonalProfileQ = {
  value: 'tikTokPersonalProfile',
  label: 'Personal Profile',
};
const tkPersonalForYouQ = {
  value: 'tikTokPersonalForYou',
  label: 'Personal For You',
};

const tkPersonalSearchQ = {
  value: 'tikTokPersonalSearch',
  label: 'Personal Search',
};

const tkPersonalNative = {
  value: 'tikTokPersonalNative',
  label: 'Personal Native',
};

const Template: Story<TabouleIndexProps<any>> = (args) => {
  return <TabouleIndex {...args} />;
};

export const YTPersonalSearches = Template.bind({});
YTPersonalSearches.args = {
  showInput: true,
  baseURL: ytBaseURL,
  queries: [ytPersonalSearchQ],
};

export const YTPersonalHomes = Template.bind({});
YTPersonalHomes.args = {
  showInput: true,
  baseURL: ytBaseURL,
  queries: [ytPersonalHomeQ],
};

export const YTPersonalVideos = Template.bind({});
YTPersonalVideos.args = {
  showInput: true,
  baseURL: ytBaseURL,
  queries: [ytPersonalVideoQ],
};

export const AllYTPersonal = Template.bind({});
AllYTPersonal.args = {
  showInput: true,
  baseURL: ytBaseURL,
  queries: [ytPersonalHomeQ, ytPersonalSearchQ, ytPersonalVideoQ],
};

export const TKPersonalNatives = Template.bind({});
TKPersonalNatives.args = {
  showInput: true,
  baseURL: tkBaseURL,
  queries: [tkPersonalNative],
};

export const TKPersonalSearch = Template.bind({});
TKPersonalSearch.args = {
  showInput: true,
  baseURL: tkBaseURL,
  queries: [tkPersonalSearchQ],
};

export const TKPersonalForYou = Template.bind({});
TKPersonalForYou.args = {
  showInput: true,
  baseURL: tkBaseURL,
  queries: [tkPersonalForYouQ],
};

export const TKPersonalProfile = Template.bind({});
TKPersonalProfile.args = {
  showInput: true,
  baseURL: tkBaseURL,
  queries: [tkPersonalProfileQ],
};

export const AllTKPersonal = Template.bind({});
AllTKPersonal.args = {
  showInput: true,
  baseURL: tkBaseURL,
  queries: [tkPersonalForYouQ, tkPersonalNative, tkPersonalProfileQ],
};
