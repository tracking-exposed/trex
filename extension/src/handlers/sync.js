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

function handleInfo(type, e) {
    state.content.push({
        ...e,
        incremental: state.incremental,
        clientTime: getTimeISO8601(),
        type: 'leafs',
    });
    state.incremental++;
}

function sync (hub) {
    if (state.content.length) {
        const uuids = _.size(_.uniq(_.map(state.content, 'randomUUID')));
        console.log(`sync tot (${state.content.length}/${state.incremental}) ${JSON.stringify(_.countBy(state.content, 'type'))} with ${uuids} randomUUID(s) with ${uuids} randomUUID(s) [if leafs ${JSON.stringify(_.countBy(_.filter(state.content, {type: 'leafs'}), 'selectorName'))}]`);
        // Send timelines to the page handling the communication with the API.
        // This might be refactored using something compatible to the HUB architecture.
        bo.runtime.sendMessage({ type: 'sync', payload: state.content, userId: 'local' },
                                   (response) => hub.event('syncResponse', response));
        state.content = [];
    }
}

export function register (hub) {
    hub.register('newVideo', handleVideo);
    hub.register('newInfo', handleInfo);
    hub.register('windowUnload', sync.bind(null, hub));
    window.setInterval(sync.bind(null, hub), INTERVAL);
}

