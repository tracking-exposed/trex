import { ScraperDefinition } from '../../models/ScraperDefinition';

export const forYouScraper: ScraperDefinition = {
  description: {
    propType: 'string',
    selectorType: 'querySelector',
    selector: '[data-e2e="video-desc"]',
  },

  baretext: {
    propType: 'string',
    selectorType: 'querySelectorAll',
    selector: '[data-e2e="video-desc"] span',
  },

  hashtags: {
    propType: 'string[]',
    selectorType: 'querySelectorAll',
    selector: '[data-e2e="video-desc"] strong',
    action: 'filter',
    filter: { startsWith: '#' },
  },

  metrics: {
    propType: 'object',
    properties: {
      liken: {
        propType: 'string',
        selectorType: 'querySelector',
        selector: '[data-e2e="like-count"]',
      },

      commentn: {
        propType: 'string',
        selectorType: 'querySelector',
        selector: '[data-e2e="comment-count"]',
      },

      sharen: {
        propType: 'string',
        selectorType: 'querySelector',
        selector: '[data-e2e="share-count"]',
      },
    },
  },

  author: {
    propType: 'object',
    properties: {
      username: {
        propType: 'string',
        selectorType: 'querySelector',
        selector: '[data-e2e="video-author-uniqueid"]',
      },

      name: {
        propType: 'string',
        selectorType: 'querySelector',
        selector: '[data-e2e="video-author-nickname"]',
      },

      link: {
        propType: 'string',
        selectorType: 'none',
        action: 'concatenate',
        concatenate: ['/@', ['author', 'name']],
      },
    },
  },

  music: {
    propType: 'object',
    properties: {
      name: {
        propType: 'string',
        selectorType: 'querySelector',
        selector: '[data-e2e="video-music"]',
      },

      url: {
        propType: 'string',
        selectorType: 'querySelector',
        selector: '[data-e2e="video-music"] a',
        action: 'getAttribute',
        getAttribute: 'href',
      },
    },
  },
};



export default forYouScraper;
