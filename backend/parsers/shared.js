const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('parsers:shared');

function attribution(relink) {
  /* a relative link like: /model/crystal-lust or /channels/roccosiffredi */
  return relink.split('/')[1];
}

function dissectV(v) {
    const tre = v.parentNode.parentNode.parentNode.querySelector('.usernameWrap');
    const linked = tre ? tre.querySelector('a') : null;
    const authorLink = linked ? linked.getAttribute('href') : null;
    const viewstr = v.parentNode.parentNode.querySelector('.views > var').textContent
    const views = unitParse(viewstr);
    const valuestr = v.parentNode.parentNode.querySelector('.value').textContent;
    const value = _.parseInt(valuestr);
    const thumbaddr = v.querySelector('[data-mediumthumb]').getAttribute('data-mediumthumb');
    const publisherType = attribution(authorLink);
    const duration = v.parentNode.querySelector('.duration').textContent.trim();
    const fixedDuration = fixHumanizedTime(duration);
    const durationSeconds = moment.duration(fixedDuration).asSeconds();

    const href = v.getAttribute('href');
    const p = new URLSearchParams(v.href.replace(/\/view_video\.php\?/, ''));
    const videoId = p.get('viewkey');

    return {
        title: v.getAttribute('data-title'),
        authorName: tre ? tre.textContent.trim() : null,
        authorLink,
        durationSeconds,
        publisherType,
        duration,
        views,
        value,
        thumbnail: thumbaddr,
        href,
        videoId
    }
};

function fixHumanizedTime(inputstr) {
    // this function fix the time 0:10, 10:10, in HH:MM:SS
    if(inputstr.length == 4)
        return '0:0' + inputstr;
    if(inputstr.length == 5)
        return '0:' + inputstr;
    if(inputstr.length >= 9)
        debug("Warning this is weird in fixHumanizedTime: [%s]", inputstr);
    return inputstr;
}

function getFeatured(D) {
  const x = D.querySelectorAll('.pcVideoListItem');
  const returned = _.map(x, function(n, order) {
      const ret = { order };
      const href = n.querySelector('a').getAttribute('href');

      if(!_.startsWith(href, '/'))
        return false;

      const videoId = n.querySelector('a').getAttribute('href').replace(/.*\?viewkey=/, '');

      let title = n.querySelector('.linkVideoThumb').getAttribute('data-title');
      if(!title)
        title = n.querySelector('a').getAttribute('title');
      if(!title)
        title = n.querySelector('.title').textContent.trim();

      _.set(ret, 'duration', n.querySelector('.duration').textContent.trim());
      _.set(ret, 'publicationRelative', n.querySelector('.added').textContent.trim());
      _.set(ret, 'views', n.querySelector('.views').querySelector('var').textContent);
      _.set(ret, 'viewString', n.querySelector('.views').textContent.trim());
      _.set(ret, 'title', title);
      _.set(ret, 'href', href);
      _.set(ret, 'videoId', videoId);
      _.set(ret, 'thumbnail', n.querySelector('img').getAttribute('data-thumb_url'));

      try {
          const usernameWrap = n.querySelector('.usernameWrap');
          _.set(ret, 'authorLink', usernameWrap.querySelector('a').getAttribute('href'));
          _.set(ret, 'authorName', usernameWrap.textContent.trim());
      } catch(error) { 
          ret.authorLink = null;
          ret.authorName = null;
      }
      return ret;
  });
  return returned;
}

function getHomeVideos(D) {
    
    let titles = D.querySelectorAll('.sectionTitle');

    const sections = _.map(titles, function(node, order) {
        const secondTag = node.children[1].tagName;
        if(!(node.children[1].children && node.children[1].children[0] &&
             node.children[1].children[0].tagName) ) {
                debug("No section name (location %d from 0) in: {%s}", order, node.children[1].outerHTML);
                return null;
            }

        let videos = _.map(node.parentNode.querySelectorAll(".linkVideoThumb"), dissectV);
        
        if(_.startsWith(secondTag,'H')) {
            return {
                order,
                tagName: node.children[1].tagName,
                href: node.children[1].children[0].getAttribute('href'),
                display: node.children[1].children[0].textContent.trim(),
                videos,
            }
        }   
        return null;
    });

    // debug("Potential titles %d -> %s", _.size(titles), _.map(sections, 'display'));
    return _.compact(sections);
}


const unitMap = { "K": 1000, "M": 1000000, "none": 1 };

function unitParse(str) {
  /* in PH the only presence of '.' is to count some 6.1M, no comma,
     this is a simplification from fbtrex code */
    const unit = str.substr(-1);
    const multiplier = _.isUndefined(unitMap[unit]) ? unitMap["none"] : unitMap[unit];
    const mult = str.replace(/(\c)/, '');
    const commadot = !!mult.match(/[.]/);
    const commaless = mult.replace(/[.]/, '');

    let amount = _.parseInt(commaless) * multiplier;
    if(commadot && multiplier != 1)
        amount = amount / 10;

    // console.log(str, unit, multiplier, mult, commadot, commaless, amount);
    return amount;
};

function getSequence(D) {

  const blocks = _.map(D.querySelectorAll("li[_vkey]"), function(n, order) {
      const ret = { order };

      let title = n.querySelector('.linkVideoThumb').getAttribute('data-title');
      if(!title)
        title = n.querySelector('a').getAttribute('title');
      if(!title)
        title = n.querySelector('.title').textContent.trim();

      _.set(ret, 'duration', n.querySelector('.duration').textContent.trim());
      _.set(ret, 'publicationRelative', n.querySelector('.added').textContent.trim());
      _.set(ret, 'views', n.querySelector('.views').querySelector('var').textContent);
      _.set(ret, 'viewString', n.querySelector('.views').textContent.trim());
      _.set(ret, 'title', title);
      _.set(ret, 'href', n.querySelector('a').getAttribute('href') );
      _.set(ret, 'videoId', n.getAttribute('_vkey') );
      _.set(ret, 'thumbnail', n.querySelector('img').getAttribute('data-thumb_url'));

      try {
          const usernameWrap = n.querySelector('.usernameWrap');
          _.set(ret, 'authorLink', usernameWrap.querySelector('a').getAttribute('href'));
          _.set(ret, 'authorName', usernameWrap.textContent.trim());
      } catch(error) { 
          ret.authorLink = null;
          ret.authorName = null;
      }
      return ret;
  });
  return blocks;
}

function getMetadata(D) {
  
  const vTitle = D.querySelectorAll("h1")[0].querySelector("span").textContent.trim();
  const views = D.querySelector('div.views');

  let counting = -1;
  try {
    counting = views.querySelector(".count").textContent.trim();
  } catch(err) {
    debug("Views extractor failure (%s): %s", views.textContent, err);
  }

  /* the producer metadata */
  let producer = {};
  try {
    producer = {
        name: D.querySelectorAll('[data-type="user"] > a.bolded')[0].textContent.trim(),
        href: D.querySelectorAll('[data-type="user"] > a.bolded')[0].getAttribute('href'),
    };
  } catch(error) {
    const ref = D.querySelectorAll('.video-detailed-info')[0].querySelector('a');
    // const v = !!D.querySelectorAll('.video-detailed-info')[0].querySelector('span.verified-icon');

    producer = {
        name: ref.textContent.trim(),
        href: ref.getAttribute('href'),
        // verified: v,
    };
  } 

  if(producer && producer.href) {
      const uril = producer.href.replace(/.*pornhub.com/, '').split('/');
      producer.type = _.nth(uril, 1);
      producer.name = _.nth(uril, 2);
  }

  debug("%j %s", producer, vTitle)
  return {
    title: vTitle,
    views: counting,
    producer
  };
};

function getRelated(D) {
  const relatedUrls = D.querySelectorAll('ul#relatedVideosCenter > li');
  const related = [];

  _.each(relatedUrls, function(e) {
    const t = e.querySelector('img').getAttribute('alt');
    const thumbnail  = e.querySelector('img').getAttribute('data-thumb_url');
    const link = e.querySelector('a');
    let h = link.getAttribute('href');
    let k = h ? h.match(/viewkey=/) : null;

    if(!t || !h || !k) return;

    let rating = e.querySelector('.value');
    let view = e.querySelector('.views > var');
    let duration = e.querySelector('.duration');

    related.push({ 
        thumbnail,
        title: t,
        href: h,
        rating: rating.textContent.trim(),
        views: view.textContent.trim(),
        duration: duration.textContent.trim(),
        videoId: h.replace(/.*viewkey=/, '')
    });
  });

  return { related };
};

function getCategories(D) {
  // used by parsers/categorizer 
  const cats = D.querySelectorAll('.categoriesWrapper');

  if(_.size(cats) !== 1)
    debug("getCategories found strage condition: the categories are not 1? %d", _.size(cats));

  if(!cats[0])
    return [];

  return _.map(cats[0].querySelectorAll('a[href]'), function(e) {
    return {
      name: e.textContent.trim(),
      href: e.getAttribute('href'),
    }
  });
};


module.exports = {
    getFeatured,
    getHomeVideos,
    getMetadata,
    getRelated,
    getCategories,
    getSequence,
    unitParse,
    fixHumanizedTime,
};
