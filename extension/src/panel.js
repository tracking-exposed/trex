/* eslint-disable */

const infoIconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="10" fill="white"/>
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
</svg>
`;

// style=fill, see here: https://stackoverflow.com/questions/35844589/how-to-change-svgs-path-color
const trexIconSVG = (color) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 310 310">
    <path style="fill:${color}" d="M304.05 151.924a150.38 150.38 0 00-139.82-150v21.16c66.36 5.39 118.71 61.11 118.71 128.84s-52.35 123.45-118.71 128.84v21.16a150.38 150.38 0 00139.82-150zM24.41 151.924c0-67.73 52.35-123.45 118.71-128.84V1.924a150.37 150.37 0 000 300v-21.16c-66.36-5.39-118.71-61.11-118.71-128.84z"/>
    <path style="fill:${color}" d="M102.23 62.824a102.9 102.9 0 00-42.47 131.1l18.42-10.64a81.76 81.76 0 01140.43-81.08l18.43-10.63a102.9 102.9 0 00-134.81-28.75zM194.57 222.754a81.91 81.91 0 01-105.84-21.15l-18.43 10.63a102.9 102.9 0 00177.29-102.31l-18.42 10.6a81.9 81.9 0 01-34.6 102.23z"/>
    <path style="fill:${color}" d="M181.37 103.924a55.41 55.41 0 00-69.52 11.65l18.84 10.88a34.29 34.29 0 0156.52 32.63l18.84 10.87a55.41 55.41 0 00-24.68-66.03zM136.53 181.624a34.35 34.35 0 01-16.39-36.88l-18.84-10.82a55.4 55.4 0 0094.2 54.38l-18.85-10.88a34.33 34.33 0 01-40.12 4.2z"/>
</svg>
`;

export function createElement (tag, cssProp = {}, parent = document.body, id = null) {
  const element = document.createElement(tag);
  Object.entries(cssProp).forEach(([key, value]) => {
    element.style[key] = value;
  });
  if (id) {
    element.setAttribute('id', id);
  }
  parent.appendChild(element);

  return element;
}

const containerCSS = {
  position: 'absolute',
  top: '0rem',
  left: '0rem',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 9999
};

const circleCSS = {
  width: '1.4rem',
  height: '1.4rem',
  padding: '0.6rem'
};

const helpCSS = {
  padding: '2rem',
  position: 'absolute',
  top: '20px',
  left: '20px',
  background: 'white',
  minWidth: '450px',
  border: '1px solid #eee',
  boxShadow: '2px 2px 8px 0 rgba(0, 0, 0, 0.2)',
  fontFamily: 'Roboto, Arial, sans-serif;',

  visibility: 'hidden'
};

let visibilityTimerId = null;

/**
 * Check if the page is in full screen
 */
function getIsFullScreen () {
  return window.innerHeight === screen.height;
}

/**
 * Create the panel
 * @param {object} Object like: {[EVENT_NAME]: {color: string}}
 */
export function createPanel (events, helpBody = '') {
  const alreadyInitializedPanel = [...document.querySelectorAll('#panel')]
  if (alreadyInitializedPanel.length > 0) {
    console.warn('YTTREX > panel ===}> panel is already initialized, maybe extension reloaded twice?');
    alreadyInitializedPanel.forEach(p => document.body.removeChild(p));
  }

  if (visibilityTimerId) {
    clearInterval(visibilityTimerId);
  }

  const gray = '#bbb';

  const container = createElement('div', containerCSS, document.body, 'panel');

  const blinkingIcons = Object.entries(events).map(([eventName, val]) => {
    const eventIcon = createElement('div', {
      ...circleCSS,
      transition: 'all 0.3s ease'
    }, container, eventName);
    eventIcon.innerHTML = trexIconSVG(gray);
    return [eventName, eventIcon, val];
  });

  const infoIcon = createElement('div', {
    ...circleCSS,
    cursor: 'pointer',
    position: 'relative'
  }, container, 'info-icon');

  infoIcon.innerHTML = infoIconSVG;

  const help = createElement('div', helpCSS, infoIcon, 'info-icon');
  help.innerHTML = helpBody;

  infoIcon.addEventListener('click', () => {
    help.style.visibility = help.style.visibility === 'hidden'
      ? 'visible'
      : 'hidden';
  });

  const nameBlink = blinkingIcons
  .map(([eventName, eventIcon, val]) => {
    const blink = (time = 1000) => {
      const paths = [...eventIcon.querySelectorAll('path')];
      paths.forEach(path => {
        path.setAttribute('style', `fill: ${val.color}`);
      });
      setTimeout(() => {
        paths.forEach(path => {
            path.setAttribute('style', `fill: ${gray}`);
          });
        }, time);
    };
    return [eventName, blink];
  });

  visibilityTimerId = setInterval(() => {
    const isFullScreen = getIsFullScreen();
    container.style.visibility = isFullScreen ? 'hidden' : 'visible';

    checkTheatreMode();
  }, 2000);

  window.addEventListener('resize', checkTheatreMode);

  return Object.fromEntries(nameBlink);
}

function checkTheatreMode () {
  const container = document.getElementById('panel')
  const videoElements = [...document.querySelectorAll('video')];

  // NOTE: is there a YouTube state where there more then one video in the page?
  if (videoElements.length === 1) {
    const video = videoElements[0];

    const videoWidth = Number(video.style.width.slice(0, -2));
    const isTheatreMode = videoWidth === window.innerWidth;
    container.style.paddingTop = isTheatreMode
      ? (Number(video.style.height.slice(0, -2)) + 73) + 'px'
      : 0;
  }
}
