function buildAPIURL(apiName) {
    var elements = window.document.location.pathname.split('/');
    var name = elements.pop();
    var testId = elements.pop();
    return { name: name, testId: testId, url: `/api/v1/${apiName}/${testId}/${name}` };
};

function appendVideoAnticipation(video, n) {
    var videoInfo = [
        '<div class="col-md-12 anticipation">',
            '<span class="col-md-2 ', video.videoId, '"></span>',
            '<span class="col-md-1 prev-order">', video.order, '</span>',
            '<span class="col-md-3 prev-title">', 
                '<a target=_blank href="', video.href, '">►</a> ',
                video.title,
            '</span>', 
            '<span class="col-md-3 prev-author">', 
                '<a target=_blank href="https://youtube.com' + video.authorSource + '">' + video.authorName + "</a>",
            '<span class="col-md-2 ', video.videoId, '"></span>',
        '</div>'
    ].join('');
    $("#video--pretty").append(videoInfo);
};

function printList() {
    var urinfo = buildAPIURL('sequence');

    $.getJSON(urinfo.url, function(videos) {

        if(videos.error) {
            console.log("Error!?");
            $(".intro").append(videos.error);
            return;
        };

        console.log(`printList/sequence: ${urinfo.url} returns ${_.size(videos.list)} videos`);
        console.log(videos);

        // this append human readable videos to #video--pretty
        _.each(videos.list, appendVideoAnticipation);

        // this append the <pre> invisibile element to be parse by web-extension
        $("#video--list").append('<pre>' + JSON.stringify(videos) + '</pre>');

        // all the yellow-background variables
        $("#humanizedTime").text(videos.humanize);
        $("#tabtime").text(videos.tabtime);
        $("#videoNumber").text(_.size(videos.list));
        $(".authorName").text(_.first(videos.list).p);
    });
};

/*
 * --- RESULTS PAGE BELOW, it should display a list of videos tested, with a sublist of their `related` ---
 */

function generateTable(evidences) {

    var retval = [ '<table>', '<tbody>' ]
    _.times(20, function(i) {
        var videocombo = pickThe(i, _.orderBy(evidences, 'p') );
        
        var row = _.map(videocombo, function(v) {
            var cleanSource = v.source.replace(/[\ \? \)\(\}\{\]\[\=\^\&\%\/\#\!\.\-\_\']/g, '');
            return '<td class="highlighter ' + v.videoId + '">' + 
                '<small class="number">' + (i + 1) + ' </small>' + 
                v.title + 
                '<p class="publisher '+ cleanSource +'">' + v.source + '</p>'
                '<td>';
        });
        
        retval = _.concat(retval, '<tr>', row, '</tr>');
    });
    console.log(retval);
    return _.concat(retval, [ '</tbody>', '<table>' ]).join('');
};

function pickThe(index, list) {
    var videoinfo = _.map(list, function(e) {
        return _.nth(e.related, index);
    });
    return videoinfo;
}

function produceTitles(evidences) {
    var titles = _.countBy(evidences, 'title');
    var rows = _.map(_.keys(titles), function(title, index) {
        var filtered = _.filter(evidences, { title: title});
        return [
            '<div class="col-md-12 header">',
                '<span class="col-md-1 unit">',
                    index + 1,
                '</span>',
                '<span class="col-md-7 unit title">', 
                    title,
                '</span>',
                '<span class="col-md-2 unit info">',
                    _.first(filtered).authorName,
                '</span>',
            '</div>',
            '<div class="col-md-12 result " id="'+ _.first(filtered).videoId +'">',
            '</div>',
        ];
    });
    return _.flatten(rows).join('');
};

function produceHeader(name, evidences) {
    $("#name").text(name);
    var byUsers = _.countBy(evidences, 'p');
    $("#users").text(_.size(_.keys(byUsers)));
};

function printResults() {
    var urinfo = buildAPIURL('results');

    $.getJSON(urinfo.url, function(content) {
        var evidences = _.get(content, 'evidences');
        console.log(`printResults/results: ${urinfo.url} returns ${_.size(evidences)} evidences, divergency ${content.name}`);
        produceHeader(content.name);
        /* every video processed is represented by their entry and below a table to compare the related, this first step
         * created a line for every video, with an id named as their videoId */
        $("#results").html(produceTitles(evidences));

        _.each(_.groupBy(evidences, 'videoId'), function(comparisons, vId) {
            $('#' + vId).append(generateTable(comparisons));
        });

        $(".highlighter").on('click', function(e) {
            console.log("manage this thing");
        });
    });
};
