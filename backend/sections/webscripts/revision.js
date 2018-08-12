

function doHTMLentries(dictionary) {
    return _.flatten(_.map(dictionary, function(value, key) {

        if(key === 'savingTime') {
            var D = moment.duration(
                        moment() - moment(value, moment.ISO_8601)
                    ).humanize();
            return [ '<li>', '<span class="times">savingTime (relative) ', D, ' ago.', '</li>' ];
        }

        if(key === 'related')
            return '';

        return ['<li>', '<b>', key, '</b>:', '<span class="metaentry">', value, '</span>', '</li>'];

    })).join('');
};

function doRelatedVideo(related) {

    return _.map(related, function(r, counter) {
        return '<div class="related">' + 
            '<h3>' + (counter + 1) + '</h3>' + 
            '<p>' + r.title + '</p>' +
            '<span>' + r.viewStr + '</span>' +
            '<p>' + r.source + '</p>' +
            '<span>' + r.link + '</span>' +
        '</div>';
    }).join('');
};


function loadsnippet(metadataContainer, htmlContainer) {

    var htmlId = document.location.pathname.split('/').pop();

    if(htmlId.length == 40) {
        var url = '/api/v1/html/' + htmlId;
    } else {
        console.error("htmlId not found");
        console.log(document.location);
    }
    console.log(url);

    $.getJSON(url, function(something) {
         
        var content= something.html;
        
        $(metadataContainer).html(
            '<ul class="fb--icon-list">' +
            doHTMLentries(something.metadata) +
            '</ul>' +
            doRelatedVideo(something.metadata.related)
        );

        $(htmlContainer).text(something.html);

        $('#bymeta').attr('href', '/revision/' + something.metadata.id);
    });
};


