
var parsers = [
    'postType',
    'feedBasicInfo',
    'feedUTime',
    'feedReactions',
    'promotedInfo',
    'promotedLink',
    'promotedTitle',
    'feedText',
    'feedHref',
    'imgAltTag'
];

function getParserHref(parserName) {
    return _.reduce(parsers, function(memo, p) {
        if(memo)
            return memo;
        if(p == parserName)
            return 'https://github.com/tracking-exposed/facebook/blob/master/parsers/' + p + '.js';
    }, undefined);
};

function getParserByBool(parserName) {
    var href = getParserHref(parserName);
    return '<a href="' + href + '" target="_blank">' + parserName + '</a>';
}

function failOrSuccess(value) {
    if(value) {
        return '<span class="metaresult success">☑ </span>';
    } else {
        return '<span class="metaresult failure">☒ </span>';
    }
};


function doHTMLentries(dictionary) {
    return _.flatten(_.map(dictionary, function(value, key) {
        if(_.isBoolean(value)) {
            return [ '<li>', failOrSuccess(value), getParserByBool(key) + '</li>' ];
        }
        /* TODO manage all the dates in the same way */
        if(key === 'savingTime') {
            var D = moment.duration(
                        moment() - moment(value, moment.ISO_8601)
                    ).humanize();
            return [ '<li>', '<span class="times">saved ', D, ' ago.', '</li>' ];
        }
        return ['<li>', '<b>', key, '</b>:',
            '<span class="metaentry">', value, '</span>',
        '</li>'];
    })).join('');
};


function loadsnippet(metadataContainer, renderContainer) {

    var htmlId = document.location.pathname.split('/').pop();

    if(htmlId.length == 40) {
        var url = '/api/v1/html/' + htmlId;
    } else {
        console.error("htmlId not found");
        console.log(document.location);
    }
    console.log(url);

    $.getJSON(url, function(something) {
        console.log("Metadata[s] " + JSON.stringify(something.metadata));
         
        var content= something.html;
        
        $(renderContainer).html(content);
        $(metadataContainer).html(
            '<ul class="fb--icon-list">' +
            doHTMLentries(something.metadata) +
            '</ul>'
        );
        $('#bymeta').attr('href', '/revision/' + something.metadata.id);
        $('#bysnippet').attr('href', '/revision/' + something.metadata.id);

        console.log("resize retry");
        $('.realitycontainer img').attr('width','');
        $('.realitycontainer img').attr('height','');
    });
};


