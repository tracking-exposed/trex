const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:youchoose');
const fetchOpengraph = require('fetch-opengraph');

const automo = require('../lib/automo');
const params = require('../lib/params');
const utils = require('../lib/utils');
const CSV = require('../lib/CSV');

const URLexamples = [
  {
    "type": 'wikipedia',
    "url": "https://en.wikipedia.org/wiki/Heidi_Grant_Murphy",
  },
  {
    "type": "url",
    "url": "https://www.youtube.com/watch?v=5zshYe6Agzk",
  }
]
async function byVideoId(req) {
    /* this function can be invoked in two ways: POST or GET */

/*    
    type: 'video', 'wikipedia', 'article', 'tiktok', 'url',
    format: {
        type:
        url:
        fallbackTitle: (title is provided by opengraph or by)
        descriptions: [{
            lang: <lang code>
            onelinemarkdown: ""
        }] <40 chars>,
        type: video/tiktok lead to:
        duration: 'xx',
    } */

    /*
    const mockup = buildMockup({
        'wikipedia': 2,
        'youtube': 2,
        'article': 2,
    }) */

    /* 
    TEMPORARLY DISABLED AS TOO SLOW TO BE IMPLEMENTED HERE 

    const resolved = [];
    for (urlo of URLexamples) {
        debug("rolling %s", urlo.url);
        const data = await fetchOpengraph.fetch(urlo.url);
        resolved.push({
            ...urlo,
            ...data,
        });
    } */

    const mockup = [
        {
          type: 'article',
          url: 'https://www.nytimes.com/2021/08/10/us/politics/infrastructure-bill-passes.html',
          description: 'The approval came after months of negotiations and ' +
            'despite deficit concerns, reflecting an appetite in ' +
            'both parties for the long-awaited spending package.',
          'og:url': 'https://www.nytimes.com/2021/08/10/us/politics/infrastructure-bill-passes.html',
          'og:type': 'article',
          'og:title': 'Senate Passes $1 Trillion ' +
            'Infrastructure Bill, Handing Biden a ' +
            'Bipartisan Win',
          'og:image': 'https://static01.nyt.com/images/2021/08/10/us/politics/10dc-infrastructure-sub/10dc-infrastructure-sub-facebookJumbo.jpg',
          'og:image:alt': 'Senator Chuck Schumer, the majority leader, in the Capitol last ' +
            'week. To win the compromise, Democrats — who had initially ' +
            'proposed a $2.3 trillion infrastructure plan — made major ' +
            'concessions.',
          'og:description': 'The approval came after months of negotiations and ' +
            'despite deficit concerns, reflecting an appetite in ' +
            'both parties for the long-awaited spending package.',
          'twitter:url': 'https://www.nytimes.com/2021/08/10/us/politics/infrastructure-bill-passes.html',
          'twitter:image': 'https://static01.nyt.com/images/2021/08/10/us/politics/10dc-infrastructure-sub/10dc-infrastructure-sub-facebookJumbo.jpg',
          image: 'https://static01.nyt.com/images/2021/08/10/us/politics/10dc-infrastructure-sub/10dc-infrastructure-sub-facebookJumbo.jpg',
          'twitter:description': 'The approval came after months of negotiations and ' +
            'despite deficit concerns, reflecting an appetite in ' +
            'both parties for the long-awaited spending package.',
          'twitter:title': 'Senate Passes $1 Trillion ' +
            'Infrastructure Bill, Handing Biden a ' +
            'Bipartisan Win',
          title: 'Senate Passes $1 Trillion ' +
            'Infrastructure Bill, Handing Biden a ' +
            'Bipartisan Win'
        },
        {
          type: 'article',
          url: 'http://www.ilpost.it/2021/08/10/bielorussia-lukashenko-repressione/',
          description: 'Tra il 9 e il 10 agosto 2020 il presidente Alexander ' +
            'Lukashenko disse di avere vinto le elezioni, ' +
            'nonostante le accuse di brogli: poi iniziò la ' +
            'repressione',
          'og:type': 'article',
          'og:title': 'La Bielorussia, un anno dopo - Il Post',
          'og:description': 'Tra il 9 e il 10 agosto 2020 il presidente Alexander ' +
            'Lukashenko disse di avere vinto le elezioni, ' +
            'nonostante le accuse di brogli: poi iniziò la ' +
            'repressione',
          'og:url': 'http://www.ilpost.it/2021/08/10/bielorussia-lukashenko-repressione/',
          'og:image': 'https://www.ilpost.it/wp-content/uploads/2021/08/lukashenko.jpg.webp',
          'og:image:width': '800',
          'og:image:height': '410',
          'twitter:card': 'summary_large_image',
          'twitter:image': 'https://www.ilpost.it/wp-content/uploads/2021/08/lukashenko.jpg.webp',
          image: 'https://www.ilpost.it/wp-content/uploads/2021/08/lukashenko.jpg.webp',
          'twitter:url': 'http://www.ilpost.it/2021/08/10/bielorussia-lukashenko-repressione/',
          'twitter:description': 'Tra il 9 e il 10 agosto 2020 il presidente Alexander ' +
            'Lukashenko disse di avere vinto le elezioni, ' +
            'nonostante le accuse di brogli: poi iniziò la ' +
            'repressione',
          'twitter:title': 'La Bielorussia, un anno dopo - Il Post',
          title: 'La Bielorussia, un anno dopo - Il Post'
        },
        {
          type: 'youtube',
          url: 'https://www.youtube.com/watch?v=86xWVb4XIyE',
          title: 'Bjarne Stroustrup - The Essence of C++',
          description: 'Bjarne Stroustrup, creator and developer of C++, ' +
            'delivers his talk entitled, The Essence of C++. ' +
            'Stroustrup has held distinguished posts at Texas A&M ' +
            'Univers...',
          'og:url': 'https://www.youtube.com/watch?v=86xWVb4XIyE',
          'og:title': 'Bjarne Stroustrup - The Essence of C++',
          'og:image': 'https://i.ytimg.com/vi/86xWVb4XIyE/maxresdefault.jpg',
          'og:image:width': '1280',
          'og:image:height': '720',
          'og:description': 'Bjarne Stroustrup, creator and developer of C++, ' +
            'delivers his talk entitled, The Essence of C++. ' +
            'Stroustrup has held distinguished posts at Texas A&M ' +
            'Univers...',
          'og:type': 'video.other',
          'twitter:card': 'player',
          'twitter:title': 'Bjarne Stroustrup - The Essence of C++',
          'twitter:description': 'Bjarne Stroustrup, creator and developer of C++, ' +
            'delivers his talk entitled, The Essence of C++. ' +
            'Stroustrup has held distinguished posts at Texas A&M ' +
            'Univers...',
          'twitter:image': 'https://i.ytimg.com/vi/86xWVb4XIyE/maxresdefault.jpg',
          image: 'https://i.ytimg.com/vi/86xWVb4XIyE/maxresdefault.jpg',
          'twitter:url': 'https://www.youtube.com/watch?v=86xWVb4XIyE'
        },
        {
          type: 'youtube',
          url: 'https://www.youtube.com/watch?v=fqMOX6JJhGo',
          title: 'Docker Tutorial for Beginners - A Full DevOps ' +
            'Course on How to Run Applications in Containers',
          description: 'Get started using Docker with this end-to-end ' +
            'beginners course with hands-on labs.Docker is an open ' +
            'platform for developers and sysadmins to build, ship, ' +
            'and...',
          'og:url': 'https://www.youtube.com/watch?v=fqMOX6JJhGo',
          'og:title': 'Docker Tutorial for Beginners - A Full DevOps ' +
            'Course on How to Run Applications in Containers',
          'og:image': 'https://i.ytimg.com/vi/fqMOX6JJhGo/maxresdefault.jpg',
          'og:image:width': '1280',
          'og:image:height': '720',
          'og:description': 'Get started using Docker with this end-to-end ' +
            'beginners course with hands-on labs.Docker is an open ' +
            'platform for developers and sysadmins to build, ship, ' +
            'and...',
          'og:type': 'video.other',
          'twitter:card': 'player',
          'twitter:title': 'Docker Tutorial for Beginners - A Full DevOps ' +
            'Course on How to Run Applications in Containers',
          'twitter:description': 'Get started using Docker with this end-to-end ' +
            'beginners course with hands-on labs.Docker is an open ' +
            'platform for developers and sysadmins to build, ship, ' +
            'and...',
          'twitter:image': 'https://i.ytimg.com/vi/fqMOX6JJhGo/maxresdefault.jpg',
          image: 'https://i.ytimg.com/vi/fqMOX6JJhGo/maxresdefault.jpg',
          'twitter:url': 'https://www.youtube.com/watch?v=fqMOX6JJhGo'
        }
      ];
    return { json: mockup };
};

module.exports = {
    byVideoId,
};
