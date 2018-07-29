import React from 'react';

import marked from 'marked';

// TBH dunno why this is not customizable. Anyway: https://www.youtube.com/watch?v=7x8wPt8xarE
// From: https://github.com/chjj/marked/blob/master/lib/marked.js#L869
function link (href, title, text) {
    if (this.options.sanitize) {
        try {
            var prot = decodeURIComponent(unescape(href))
            .replace(/[^\w:]/g, '')
            .toLowerCase();
        } catch (e) {
            return '';
        }
        if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
            return '';
        }
    }
    var out = '<a href="' + href + '"';

    if (title) {
        out += ' title="' + title + '"';
    }
    out += ' target="_blank"';
    out += '>' + text + '</a>';
    return out;
};

const renderer = new marked.Renderer();

const noParagraphRenderer = new marked.Renderer();

marked.Renderer.prototype.link = link;
// noParagraphRenderer.paragraph = function (text) { return text; };

export function t (msg, ...params) {
    return chrome.i18n.getMessage(msg, ...params);
}

export const T = React.createClass({

    render () {
        let { msg, tag, args, ...props } = this.props;
        const Tag = tag === undefined ? 'p' : tag;

        if (args === undefined) {
            args = [];
        } else if (typeof args === 'string') {
            args = [args];
        }

        const message = t(msg, ...args);
        let htmlMessage;

        if (tag !== undefined && message.indexOf('\n') === -1) {
            htmlMessage = marked(message, { renderer: noParagraphRenderer });
        } else {
            htmlMessage = marked(message, { renderer: renderer, breaks: true });
        }

        return (
            <Tag {...props} dangerouslySetInnerHTML={{__html: htmlMessage}} />
        );
    }
});
