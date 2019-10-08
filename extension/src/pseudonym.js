// This code just store in a global setting the pseudonym

var recorded = null;

function get() {
    return recorded;
}

function set(input) {
    console.log("pseudonym.set:", input);
    recorded = input;
}

module.exports = {
    get: get,
    set: set,
}
