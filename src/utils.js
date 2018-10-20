import bs58 from 'bs58';

export function getLogoDataURI () {
    return "data:image/png;base64,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";
};

export function getTimeISO8601 (date) {
    // Thanks to http://stackoverflow.com/a/17415677/597097
    const now = date || new Date();
    const tzo = -now.getTimezoneOffset();
    const dif = tzo >= 0 ? '+' : '-';
    const pad = (num) => {
        const norm = Math.abs(Math.floor(num));
        return (norm < 10 ? '0' : '') + norm;
    };
    return [
        now.getFullYear(), '-',
        pad(now.getMonth() + 1), '-',
        pad(now.getDate()), 'T',
        pad(now.getHours()), ':',
        pad(now.getMinutes()), ':',
        pad(now.getSeconds()), dif,
        pad(tzo / 60), ':',
        pad(tzo % 60)
    ].join('');
}


export function isEmpty (object) {
    return object === null || object === undefined || Object.keys(object).length === 0;
}

export function isFunction (value) {
    return value instanceof Function;
}

export function decodeString (s) {
    // Credits: https://github.com/dchest/tweetnacl-util-js
    var d = unescape(encodeURIComponent(s));
    var b = new Uint8Array(d.length);

    for (var i = 0; i < d.length; i++) {
        b[i] = d.charCodeAt(i);
    }
    return b;
}

export function decodeKey (key) {
    return new Uint8Array(bs58.decode(key));
}
