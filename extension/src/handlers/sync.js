import config from '../config';
import { getTimeISO8601 } from '../utils';
const bo = chrome || browser;

const INTERVAL = config.FLUSH_INTERVAL;

var state = {
    incremental: 0,
    content: [],
};

function handleVideo (type, e) {
    state.content.push({
        ...e,
        incremental: state.incremental,
        clientTime: getTimeISO8601(),
        type: 'video',
    });
    state.incremental++;
}

function handleSugg(type, e) {
    state.content.push({
        ...e,
        incremental: state.incremental,
        clientTime: getTimeISO8601(),
        type: 'suggested',
    });
    state.incremental++;
}

function sync (hub) {
    if (state.content.length) {
        console.log(`sync tot (${state.content.length}/${state.incremental}) ${JSON.stringify(_.countBy(state.content, 'type'))}`);
        // Send timelines to the page handling the communication with the API.
        // This might be refactored using something compatible to the HUB architecture.
        bo.runtime.sendMessage({ type: 'sync', payload: state.content, userId: 'local' },
                                   (response) => hub.event('syncResponse', response));
        state.content = [];
    }
}

export function register (hub) {
    hub.register('newVideo', handleVideo);
    hub.register('suggested', handleSugg);
    hub.register('windowUnload', sync.bind(null, hub));
    window.setInterval(sync.bind(null, hub), INTERVAL);
}

