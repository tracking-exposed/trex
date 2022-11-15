import {
  MetadataLogger,
  MetadataLoggerProps,
} from '@shared/extension/ui/components/MetadataLogger';
import { ParserConfiguration } from '@shared/providers/parser.provider';
import { Meta, Story } from '@storybook/react';
import tkHub from '@tktrex/extension/src/handlers/hub';
import * as tkContributionsArb from '@tktrex/shared/arbitraries/ContributionEvent.arb';
import * as ytContributionsArb from '@yttrex/shared/arbitraries/ContributionEvent.arb';
import { metadataLoggerProps as tkMetadataLoggerParserProps } from '@tktrex/shared/parser/metadata-logger';
import ytHub from '@yttrex/extension/src/handlers/hub';
import { metadataLoggerParserProps } from '@yttrex/shared/parser/metadata-logger';
import fc from 'fast-check';
import * as React from 'react';

const meta: Meta<MetadataLoggerProps<any, any, ParserConfiguration, any>> = {
  title: 'Example/MetadataLogger',
  component: MetadataLogger,
};

export default meta;

const Template: Story<
  MetadataLoggerProps<any, any, ParserConfiguration, any> & {
    platform: 'yttrex' | 'tktrex';
    arbs: {
      [key: string]: () => fc.Arbitrary<any>;
    };
  }
> = ({ platform, arbs, ...args }) => {
  const handleCollect = React.useCallback((k: keyof typeof arbs) => {
    const arb = arbs[k]();
    args.hub.dispatch(fc.sample(arb, 1)[0]);
  }, []);

  return (
    <div>
      <div>
        {Object.keys(arbs).map((key) => (
          <button key={key} onClick={() => handleCollect(key)}>
            Collect {key}
          </button>
        ))}
      </div>
      <MetadataLogger {...args} />
    </div>
  );
};

export const YoutubeBasic = Template.bind({});
YoutubeBasic.args = {
  platform: 'yttrex',
  hub: ytHub,
  arbs: {
    home: () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fixture = require(`../../../yttrex/backend/__tests__/fixtures/htmls/home/1c144b8476d67668f19cc9e8d4f235890181d26a.json`);
      const { html, href } = fixture.sources[0];
      return ytContributionsArb.ContributionEventArb.map((e) => ({
        type: 'NewVideo',
        payload: {
          ...e,
          element: html,
          href,
          clientTime: new Date(),
        },
      }));
    },
    search: () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fixture = require(`../../../yttrex/backend/__tests__/fixtures/htmls/search/0b1f85779539e6a0bd95304902cfd8117a69c82b.json`);
      const { html, href } = fixture.sources[0];
      return ytContributionsArb.ContributionEventArb.map((e) => ({
        type: 'NewVideo',
        payload: {
          ...e,
          html,
          href,
          clientTime: new Date(),
        },
      }));
    },
    video: () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fixture = require(`../../../yttrex/backend/__tests__/fixtures/htmls/video/004fdccdb8bddf7a2588fcbf09916015ff898238.json`);
      const { html, href } = fixture.sources[0];
      return ytContributionsArb.ContributionEventArb.map((e) => ({
        type: 'NewVideo',
        payload: {
          ...e,
          html,
          href,
          clientTime: new Date(),
        },
      }));
    },
  },
  ...metadataLoggerParserProps,
};

export const TikTokBasic = Template.bind({});
TikTokBasic.args = {
  platform: 'tktrex',
  hub: tkHub,
  arbs: {
    search: () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fixture = require(`../../../tktrex/backend/__tests__/fixtures/search/812b7e93d62ad6fdde6630c34c5ecfe7720474bb.json`);
      const { html, href, } = fixture.sources[0];
      return tkContributionsArb.ContributionEventArb.map((e) => ({
        type: 'search',
        payload: {
          ...e,
          html,
          href,
          clientTime: new Date(),
        },
      }));
    },
    native: () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fixture = require(`../../../tktrex/backend/__tests__/fixtures/native/1c144b8476d67668f19cc9e8d4f235890181d26a.json`);
      const { html, href } = fixture.sources[0];
      return tkContributionsArb.ContributionEventArb.map((e) => ({
        type: 'native',
        payload: {
          ...e,
          html,
          href,
          clientTime: new Date(),
        },
      }));
    },
  },
  ...tkMetadataLoggerParserProps,
};
