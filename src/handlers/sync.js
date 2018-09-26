import config from '../config';
import { getTimeISO8601 } from '../utils';
const bo = chrome || browser;

const INTERVAL = config.FLUSH_INTERVAL;

var state = {
    incremental: 0,
    videos: []
};

function handleVideo (type, e) {
    state.videos.push({
        element: e.element,
        tagId: config.settings.tagId,
        href: e.href,
        incremental: state.incremental,
        clientTime: getTimeISO8601()
    });
    state.incremental++;
}

function sync (hub) {
    if (state.videos.length) {
        console.log(`found video to flush (${state.videos.length})`);
        // Send timelines to the page handling the communication with the API.
        // This might be refactored using something compatible to the HUB architecture.
        bo.runtime.sendMessage({ type: 'sync', payload: state.videos, userId: 'local' },
                                   (response) => hub.event('syncResponse', response));
        state.videos = [];
    } else console.log("queue is empty");
}

export function register (hub) {
    hub.register('newVideo', handleVideo);
    hub.register('windowUnload', sync.bind(null, hub));
    window.setInterval(sync.bind(null, hub), INTERVAL);
}





