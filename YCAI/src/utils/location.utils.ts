import {
  getCurrentView,
  getDoUpdateCurrentView,
  HistoryLocation,
} from 'avenger/lib/browser';

export type CurrentView =
  | { view: 'labEdit'; videoId: string }
  | { view: 'lab' }
  | { view: 'analytics' }
  | { view: 'settings' }
  | { view: 'linkAccount' }
  | { view: 'index' };

const labEditRegex = /^\/lab\/([^/]+)$/;
const labRegex = /^\/lab\/$/;
const analyticsRegex = /^\/analytics\/$/;
const settingsRegex = /^\/settings\/$/;
const linkAccountRegex = /^\/link-account\/$/;

export function locationToView(location: HistoryLocation): CurrentView {
  const { path: currentPath = '', ...search } = location.search;
  const labEditViewMatch = currentPath.match(labEditRegex);

  if (labEditViewMatch !== null) {
    return { view: 'labEdit', videoId: labEditViewMatch[1], ...search };
  }

  const labViewMatch = currentPath.match(labRegex);

  if (labViewMatch !== null) {
    return { view: 'lab' };
  }

  const communityMatch = currentPath.match(analyticsRegex);
  if (communityMatch !== null) {
    return { view: 'analytics' };
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
    case 'labEdit':
      return {
        pathname: `index.html`,
        search: {
          path: `/lab/${view.videoId}`,
        },
      };
    case 'lab':
      return {
        pathname: `index.html`,
        search: {
          path: '/lab/',
        },
      };
    case 'analytics':
      return {
        pathname: `index.html`,
        search: {
          path: '/analytics/',
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

export const getHostFromURL = (url: string): string =>
  new URL(url).host;

export const currentView = getCurrentView(locationToView); // ObservableQuery
export const doUpdateCurrentView = getDoUpdateCurrentView(viewToLocation); // Command
