const debug = require('debug')('parser:video');

function video(envelop, previous) {
  /* 'foryou' 'video', 'following' have a description */
  const availin = ['video', 'foryou', 'following'];

  if (previous.nature && availin.indexOf(previous.nature.type) === -1) {
    return null;
  }

  // debugger;
  /* this is the first 'a' element */
  const aelem = envelop.jsdom.querySelectorAll('a');

  if (!aelem) {
    debug('this is a really unexpected bug!');
    return null;
  }
  const videoLink = aelem[0].getAttribute('href');
  debug('work in progress %s', videoLink);
  return {
    href: videoLink,
  };
}

module.exports = video;
