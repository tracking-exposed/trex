import bs58 from 'bs58';

export function getLogoDataURI(): Document {
  return new DOMParser().parseFromString(
    '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" version="1.1" id="svg10" width="170.66667" height="170.66667" viewBox="0 0 170.66667 170.66667" sodipodi:docname="yttrex-special-logo.svg" inkscape:version="0.92.4 (5da689c313, 2019-01-14)">    <metadata id="metadata16">        <rdf:RDF>        <cc:Work rdf:about="">            <dc:format>image/svg+xml</dc:format>            <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/>            <dc:title/>        </cc:Work>        </rdf:RDF>    </metadata>    <defs id="defs14">        <inkscape:path-effect effect="spiro" id="path-effect3743" is_visible="true"/>        <inkscape:path-effect effect="spiro" id="path-effect3739" is_visible="true"/>    </defs>    <sodipodi:namedview pagecolor="#ffffff" bordercolor="#666666" borderopacity="1" objecttolerance="10" gridtolerance="10" guidetolerance="10" inkscape:pageopacity="0" inkscape:pageshadow="2" inkscape:window-width="876" inkscape:window-height="700" id="namedview12" showgrid="false" inkscape:zoom="2.1926275" inkscape:cx="85.333336" inkscape:cy="85.333336" inkscape:window-x="2637" inkscape:window-y="198" inkscape:window-maximized="0" inkscape:current-layer="svg10"/>    <g inkscape:groupmode="layer" id="layer1" inkscape:label="Layer 1"/>    <path style="fill:none;stroke:#000000;stroke-width:0.78145403px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="M 65.224353,57.967229 65.328555,112.22429 109.91082,83.969499 Z" id="path3725" inkscape:connector-curvature="0" sodipodi:nodetypes="cccc"/>  <ellipse style="fill:#ff0000;fill-opacity:1;stroke-width:1.02392244;opacity:0" id="path3727" cx="84.058121" cy="84.608551" rx="59.828979" ry="59.403904"/>    </svg>',
    'application/xml'
  );
}

export function getTimeISO8601(date?: Date): string {
  // Thanks to http://stackoverflow.com/a/17415677/597097
  const now = date ?? new Date();
  const tzo = -now.getTimezoneOffset();
  const dif = tzo >= 0 ? '+' : '-';
  const pad = (num: number): string => {
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

export function isEmpty(object: unknown): boolean {
  return (
    object === null ||
    object === undefined ||
    (typeof object === 'object' && Object.keys(object).length === 0)
  );
}

export function isFunction(value: unknown): value is Function {
  return value instanceof Function;
}

export function decodeString(s: string): Uint8Array {
  // Credits: https://github.com/dchest/tweetnacl-util-js
  const d = unescape(encodeURIComponent(s));
  const b = new Uint8Array(d.length);

  for (let i = 0; i < d.length; i++) {
    b[i] = d.charCodeAt(i);
  }
  return b;
}

export function decodeKey(key: string): Uint8Array {
  return new Uint8Array(bs58.decode(key));
}
