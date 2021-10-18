import {
  getCurrentView,
  getDoUpdateCurrentView,
  HistoryLocation,
} from 'avenger/lib/browser';

export type CurrentView =
  | { view: 'studioEdit'; videoId: string }
  | { view: 'studio' }
  | { view: 'statistics' }
  | { view: 'settings' }
  | { view: 'linkAccount' }
  | { view: 'index' };

const studioEditRegex = /^\/studio\/([^/]+)$/;
const studioRegex = /^\/studio\/$/;
const statisticsRegex = /^\/statistics\/$/;
const settingsRegex = /^\/settings\/$/;
const linkAccountRegex = /^\/link-account\/$/;

export function locationToView(location: HistoryLocation): CurrentView {
  const { path: currentPath = '', ...search } = location.search;
  const studioEditViewMatch = currentPath.match(studioEditRegex);

  if (studioEditViewMatch !== null) {
    return { view: 'studioEdit', videoId: studioEditViewMatch[1], ...search };
  }

  const studioViewMatch = currentPath.match(studioRegex);

  if (studioViewMatch !== null) {
    return { view: 'studio' };
  }

  const communityMatch = currentPath.match(statisticsRegex);
  if (communityMatch !== null) {
    return { view: 'statistics' };
  }

  const settingsMatch = currentPath.match(settingsRegex);
  if (settingsMatch !== null) {
    return { view: 'settings' };
  }

  const linkAccountMatch = currentPath.match(linkAccountRegex);
  if (linkAccountMatch !== null) {
    return { view: 'linkAccount' };
  }

  return { view: 'index' };
}

export function viewToLocation(view: CurrentView): HistoryLocation {
  switch (view.view) {
    case 'studioEdit':
      return {
        pathname: `index.html`,
        search: {
          path: `/studio/${view.videoId}`,
        },
      };
    case 'studio':
      return {
        pathname: `index.html`,
        search: {
          path: '/studio/',
        },
      };
    case 'statistics':
      return {
        pathname: `index.html`,
        search: {
          path: '/statistics/',
        },
      };
    case 'settings':
      return {
        pathname: 'index.html',
        search: {
          path: '/settings/',
        },
      };
    case 'linkAccount':
      return {
        pathname: 'index.html',
        search: {
          path: '/link-account/',
        },
      };
    case 'index':
      return { pathname: '/index.html', search: {} };
  }
}

export const currentView = getCurrentView(locationToView); // ObservableQuery
export const doUpdateCurrentView = getDoUpdateCurrentView(viewToLocation); // Command
