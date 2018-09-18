
function viewAndLikes(d) {
    var h = [
        'likes: ', d.likes, '</br>',
        'dislikes: ', d.dislikes, '</br>',
        'views: ', d.viewStr, '</br>'
    ];
    return h.join('');
};

colorCodes = {};
function generateColorCode(source) {
    var r = 190 + ( 2 * ( source.charCodeAt(0) + source.charCodeAt(1) ) % 65);
    var g = 190 + ( 2 * ( source.charCodeAt(1) + source.charCodeAt(2) ) % 65);
    var b = 190 + ( 2 * ( source.charCodeAt(0) + source.charCodeAt(2) ) % 65);
    _.set(colorCodes, source, 'rgb('+[r,g,b].join(",")+')');
}

function representRelated(memo, r) {

    var cleanSource = r.source.replace(/[\ \? \)\(\}\{\]\[\=\^\&\%\/\#\!\.\-\_\']/g, '');
    var related = [
        '<div class="related">',
            '<small class="index">',
                r.index,
            '</small>',
            '<span class="">',
                r.title,
            '<span>',
            '<span class="source ' + cleanSource + '">',
                r.source,
            '</span>',
        '</div>'
    ];

    if(!_.get(colorCodes, cleanSource))
        generateColorCode(cleanSource);

    memo += related.join('');
    return memo;

};

function parsingError(d) {
    var html = [
        '<div class="error">',
            '<pre>',
                JSON.stringify(d, undefined, 2),
            '</pre>',
        '</div>'
    ];
};

function videoDataHTML(d) {

    if(d.skipped || !d.processed)
        return parsingError(d);

    var html = [ 
        '<div class="container-fluid data">',
            '<span class="col-md-3">',
                '<span class="saved"> saved ',
                    moment(d.savingTime).format("YYYY-MM-DD HH:mm:ss"),
                    ' (',
                    moment.duration(moment(d.savingTime) - moment()).humanize(),
                    ' ago) [',
                    moment(d.clientTime).format("HH:mm:ss"),
                    ']',
                '</span>',            
                '<h2>',
                    d.title,
                '</h2>',
                '<h3>',
                    viewAndLikes(d),    
                '</h3>',
                '<a target=_blank href="https://www.youtube.com' + d.authorChannel + '">🔗 ',
                    d.authorName,
                '</a>',
                '</span>',
            '<span class="col-md-8 related-list">',
                '<p>Related videos</p>',
                _.reduce(d.related, representRelated, ""),
            '</span>',
            '<span class="col-md-1">',
                '<p>Something else we can put here?</p>',
            '</span>',
        '</div>'
    ];

    _.each(colorCodes, function(ccode, sourceName) {
        $("." + sourceName).css('background-color', ccode);
    });

    return html.join('');
};

function loadpersonal() {
    var cookieId = _.last(window.document.location.pathname.split('/'))
    $.getJSON("/api/v1/personal/" + cookieId, function(videos) {
        console.log(videos);
        _.each(videos, function(d) {
            $("#videolist").append(videoDataHTML(d));
        });
    });
};
