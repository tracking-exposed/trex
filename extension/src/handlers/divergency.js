
function recordHandshakeResult(response) {
    console.log('XXXXXXXXX, saving the pseudonym from:', response);
};

export function register (hub) {
    console.log("check registering this too")
    hub.register('handshakeResponse', recordHandshakeResult);
};
