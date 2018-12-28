function buildAPIURL(apiName) {
    var elements = window.document.location.pathname.split('/');
    var name = elements.pop();
    var testId = elements.pop();
    var pageChar = (apiName == 'sequence') ? 'd' : 'r';
    return {
        name: name,
        testId: testId,
        url: `/api/v1/${apiName}/${testId}/${name}`,
        page: `/${pageChar}/${testId}/${name}`
    };
};

function appendVideoAnticipation(video, n) {
    var videoInfo = [
        '<div class="col-md-12 anticipation">',
            '<span class="col-md-2 ', video.videoId, '"></span>',
            '<span class="col-md-1 prev-order">', video.order, '</span>',
            '<span class="col-md-3 prev-title">', 
                '<a target=_blank class="replay" id="video-order-', n, '"href="', video.href, '">►</a> ',
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
            console.log("Error", videos);
            $("#list").html('<h3 class="centered">Error: <i>test</i> not found.</h3>');
            $(".extension-present").remove();
            $(".extension-missing").remove();
            $("#extension-parsable").remove();
            return;
        };

        console.log(`printList/sequence: ${urinfo.url} returns ${_.size(videos.list)} videos`);
        console.log(videos);

        // this append human readable videos to #video--pretty
        _.each(videos.list, appendVideoAnticipation);

        // this play with all the "replay" sequence
        $(".replay").hide();
        $(".replay").on('click', showNext);
        $("#video-order-0").show();

        // all the yellow-background variables
        $(".videoNumber").text(_.size(videos.list));
        $(".authorName").text(_.first(videos.list).p);
        $(".extension-present").hide();

        // the results page 
        $(".resultLink").attr('href', buildAPIURL('results').page);
    });
};

function showNext(event) {
    // the id is 'video-order-0' ...
    var current = _.parseInt($(this).attr('id').split('-').pop());
    $(this).parent().parent().hide();
    var nextId = "#video-order-" + (current + 1);

    if(!($(nextId))) {
        var resultLink = buildAPIURL('results').page;
        $("#procedure").html("You did it! Only the first evidence per video would be considered, so you can avoid to replay it again, because it would not be considered for your pseudonym a second time. <br>Wait few seconds, and then check the <a href='"+ resultLink +"'>results</a>.");
    } else {
        $(nextId).toggle();
    }
};

/*
 * --- RESULTS PAGE BELOW, it should display a list of videos tested, with a sublist of their `related` ---
 */

function generateTable(evidences) {

    var contributorList = _.map(_.orderBy(evidences, 'p'), 'p');
    if(_.size(contributorList) == 1)
        return '<div class="notpossible">Only one contributor watch this video (' + _.first(contributorList) + '), not possible compare.</div>';

    var retval = [ '<table>', 
        '<thead>',
            _.map(contributorList, function(c) {
                return '<th class="centered">' + c + '</th>';
            }).join(""),
        '</thead>',
    '<tbody>' ];
    _.times(20, function(i) {
        var videocombo = pickThe(i, _.orderBy(evidences, 'p') );

        var row = _.map(videocombo, function(v) {
            if(!v)
                return '<td>❌</td>';

            var source = _.isUndefined(v.source) ? "*live" : v.source;
            var cleanSource = source.replace(/[\ \? \)\(\}\{\]\[\=\^\&\%\/\#\!\.\-\_\'\|]/g, '');

            return '<td class="highlighter ' + v.videoId + '">' + 
                '<small class="number">' + (i + 1) + ' </small>' + 
                v.title + 
                '<p class="publisher '+ cleanSource +'">' + source + '</p>'
                '<td>';
        });
        retval = _.concat(retval, '<tr>', row, '</tr>');
    });
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
        var filtered = _.filter(evidences, { title: title });
        return [
            '<div class="col-md-12 header">',
                '<span class="col-md-1 unit">',
                    '<span class="what">#</span>',
                    index + 1,
                '</span>',
                '<span class="col-md-1"></span>',
                '<span class="col-md-7 unit title">', 
                    '<span class="what">video: </span>',
                    title,
                '</span>',
                '<span class="col-md-2 unit info">',
                    '<span class="what">by: </span>',
                    _.first(filtered).authorName,
                '</span>',
                '<span class="col-md-1"></span>',
            '</div>',
            '<div class="col-md-12 result " id="'+ _.first(filtered).videoId +'">',
            '</div>',
        ];
    });
    return _.flatten(rows).join('');
};

function produceHeader(name, first, last, pseudonyms) {
    console.log("produceHeader", name, first, last, pseudonyms);
    $("#name").text(name);
    $("#users").text(_.size(pseudonyms));
    $("#first").text(first.h);
    $("#last").text(last.h);
    $("#lastAgo").text(last.farago);
    $("#rawDataLink").attr('href', buildAPIURL('results').url);
};

function reportSimpleList(evidences) {

    var uniqueV = _.map(_.groupBy(evidences, 'videoId'), function(aggregated, vId) {
        var fields = ['title', 'href', 'authorName' ];
        var video = _.first(aggregated);
        return _.pick(video, fields);
    });

    return _.map(uniqueV, function(v) {
        return [
            '<div class="prev-entry">',
                v.title,
                '<p class="author">',
                    v.authorName,
                '</p>',
            '</div>'
        ].join("");
    }).join("");
};

function printResults() {
    var urinfo = buildAPIURL('results');

    $.getJSON(urinfo.url, function(content) {
        var evidences = _.get(content, 'evidences');
        console.log(`printResults/results: ${urinfo.url} returns ${_.size(evidences)} evidences, divergency ${content.name}`);

        /* this populate the #header div */
        produceHeader(content.name, content.first, content.last, _.uniq(_.map(evidences, 'p')) );

        $("#videoList").html(reportSimpleList(evidences));
        /* every video processed is represented by their entry and below a table to compare the related,
         * this first step created a line for every video, with an id named as their videoId */
        $("#results").html(produceTitles(evidences));

        _.each(_.groupBy(evidences, 'videoId'), function(comparisons, vId) {
            $('#' + vId).append(generateTable(comparisons));
        });

        $(".highlighter").mouseover(function(e) {
            $(".selectedA").removeClass("selectedA");
            var vId = $(this).attr('class').replace(/highlighter\ /, '');
            $("." + vId).addClass('selectedA');
        });
        $(".publisher").mouseover(function(e) {
            $(".selectedB").removeClass("selectedB");
            var publisherId = $(this).attr('class').replace(/publisher\ /, '');
            $("." + publisherId).addClass('selectedB');
        });
    });
};
