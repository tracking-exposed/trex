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
const studioRegex = /^\/studio$/;
const statisticsRegex = /^\/statistics$/;
const settingsRegex = /^\/settings$/;
const linkAccountRegex = /^\/link-account$/;

export function locationToView(location: HistoryLocation): CurrentView {
  const studioEditViewMatch = location.pathname.match(studioEditRegex);

  if (studioEditViewMatch !== null) {
    return { view: 'studioEdit', videoId: studioEditViewMatch[1] };
  }

  const studioViewMatch = location.pathname.match(studioRegex);

  if (studioViewMatch !== null) {
    return { view: 'studio' };
  }

  const communityMatch = location.pathname.match(statisticsRegex);
  if (communityMatch !== null) {
    return { view: 'statistics' };
  }

  const settingsMatch = location.pathname.match(settingsRegex);
  if (settingsMatch !== null) {
    return { view: 'settings' };
  }

  const linkAccountMatch = location.pathname.match(linkAccountRegex);
  if (linkAccountMatch !== null) {
    return { view: 'linkAccount' };
  }

  return { view: 'index' };
}

export function viewToLocation(view: CurrentView): HistoryLocation {
  switch (view.view) {
    case 'studioEdit':
      return { pathname: `/studio/${view.videoId}`, search: {} };
    case 'studio':
      return { pathname: '/studio', search: {} };
    case 'statistics':
      return { pathname: '/statistics', search: {} };
    case 'settings':
      return { pathname: '/settings', search: {} };
    case 'linkAccount':
      return { pathname: '/link-account', search: {} };
    case 'index':
      return { pathname: '/index.html', search: {} };
  }
}

export const currentView = getCurrentView(locationToView); // ObservableQuery
export const doUpdateCurrentView = getDoUpdateCurrentView(viewToLocation); // Command
