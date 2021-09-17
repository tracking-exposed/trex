import bs58 from 'bs58';

export function getLogoDataURI() {
  // return "data:image/png;base64,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";
  /*
    return `<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" version="1.1" id="svg10" width="170.66667" height="170.66667" viewBox="0 0 170.66667 170.66667" sodipodi:docname="yttrex-special-logo.svg" inkscape:version="0.92.4 (5da689c313, 2019-01-14)">
    <metadata id="metadata16">
        <rdf:RDF>
        <cc:Work rdf:about="">
            <dc:format>image/svg+xml</dc:format>
            <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/>
            <dc:title/>
        </cc:Work>
        </rdf:RDF>
    </metadata>
    <defs id="defs14">
        <inkscape:path-effect effect="spiro" id="path-effect3743" is_visible="true"/>
        <inkscape:path-effect effect="spiro" id="path-effect3739" is_visible="true"/>
    </defs>
    <sodipodi:namedview pagecolor="#ffffff" bordercolor="#666666" borderopacity="1" objecttolerance="10" gridtolerance="10" guidetolerance="10" inkscape:pageopacity="0" inkscape:pageshadow="2" inkscape:window-width="876" inkscape:window-height="700" id="namedview12" showgrid="false" inkscape:zoom="2.1926275" inkscape:cx="85.333336" inkscape:cy="85.333336" inkscape:window-x="2637" inkscape:window-y="198" inkscape:window-maximized="0" inkscape:current-layer="svg10"/>
    <g inkscape:groupmode="layer" id="layer1" inkscape:label="Layer 1"/>
    <path style="fill:none;stroke:#000000;stroke-width:0.78145403px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="M 65.224353,57.967229 65.328555,112.22429 109.91082,83.969499 Z" id="path3725" inkscape:connector-curvature="0" sodipodi:nodetypes="cccc"/>
    <ellipse style="fill:#ff0000;fill-opacity:1;stroke-width:1.02392244;opacity:0" id="path3727" cx="84.058121" cy="84.608551" rx="59.828979" ry="59.403904"/>
    </svg>`;
    */
  return new DOMParser().parseFromString(
    '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" version="1.1" id="svg10" width="170.66667" height="170.66667" viewBox="0 0 170.66667 170.66667" sodipodi:docname="yttrex-special-logo.svg" inkscape:version="0.92.4 (5da689c313, 2019-01-14)">    <metadata id="metadata16">        <rdf:RDF>        <cc:Work rdf:about="">            <dc:format>image/svg+xml</dc:format>            <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/>            <dc:title/>        </cc:Work>        </rdf:RDF>    </metadata>    <defs id="defs14">        <inkscape:path-effect effect="spiro" id="path-effect3743" is_visible="true"/>        <inkscape:path-effect effect="spiro" id="path-effect3739" is_visible="true"/>    </defs>    <sodipodi:namedview pagecolor="#ffffff" bordercolor="#666666" borderopacity="1" objecttolerance="10" gridtolerance="10" guidetolerance="10" inkscape:pageopacity="0" inkscape:pageshadow="2" inkscape:window-width="876" inkscape:window-height="700" id="namedview12" showgrid="false" inkscape:zoom="2.1926275" inkscape:cx="85.333336" inkscape:cy="85.333336" inkscape:window-x="2637" inkscape:window-y="198" inkscape:window-maximized="0" inkscape:current-layer="svg10"/>    <g inkscape:groupmode="layer" id="layer1" inkscape:label="Layer 1"/>    <path style="fill:none;stroke:#000000;stroke-width:0.78145403px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="M 65.224353,57.967229 65.328555,112.22429 109.91082,83.969499 Z" id="path3725" inkscape:connector-curvature="0" sodipodi:nodetypes="cccc"/>  <ellipse style="fill:#ff0000;fill-opacity:1;stroke-width:1.02392244;opacity:0" id="path3727" cx="84.058121" cy="84.608551" rx="59.828979" ry="59.403904"/>    </svg>',
    'application/xml'
  );
}

export function getTimeISO8601(date) {
  // Thanks to http://stackoverflow.com/a/17415677/597097
  const now = date || new Date();
  const tzo = -now.getTimezoneOffset();
  const dif = tzo >= 0 ? '+' : '-';
  const pad = (num) => {
    const norm = Math.abs(Math.floor(num));
    return (norm < 10 ? '0' : '') + norm;
  };
  return [
    now.getFullYear(),
    '-',
    pad(now.getMonth() + 1),
    '-',
    pad(now.getDate()),
    'T',
    pad(now.getHours()),
    ':',
    pad(now.getMinutes()),
    ':',
    pad(now.getSeconds()),
    dif,
    pad(tzo / 60),
    ':',
    pad(tzo % 60),
  ].join('');
}

export function isEmpty(object) {
  return (
    object === null || object === undefined || Object.keys(object).length === 0
  );
}

export function isFunction(value) {
  return value instanceof Function;
}

export function decodeString(s) {
  // Credits: https://github.com/dchest/tweetnacl-util-js
  var d = unescape(encodeURIComponent(s));
  var b = new Uint8Array(d.length);

  for (var i = 0; i < d.length; i++) {
    b[i] = d.charCodeAt(i);
  }
  return b;
}

export function decodeKey(key) {
  return new Uint8Array(bs58.decode(key));
}
