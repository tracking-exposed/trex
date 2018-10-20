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
        console.log(`printList/sequence: ${urinfo.url} returns ${_.size(videos.list)} videos`);

        // this append human readable videos to #video--pretty
        _.each(videos.list, appendVideoAnticipation);

        // this append the <pre> invisibile element to be parse by web-extension
        $("#video--list").append('<pre>' + JSON.stringify(videos) + '</pre>');

        // all the yellow-background variables
        $("#humanizedTime").text(videos.humanize);
        $("#tabtime").text(videos.tabtime);
        $("#videoNumber").text(_.size(videos.list));
        $("#authorName").text(_.first(videos.list).p);
    });
};

/*
 * --- RESULTS PAGE BELOW, it should be a list of video tested, with a sublist of their results ---
 */
function computeSummary() {
    return "smthg";
};

function produceHeader(videos) {
    var vIds = _.countBy(videos, 'videoId');
    var vTitles = _.countBy(videos, 'title');

    var rows = _.map(videos, function(v) {
        console.log(v);
        return [
            '<div class="col-md-12">',
                '<span class="col-md-4 title">', 
                    v.title,
                '</span>',
                '<span class="col-md-4 info">',
                    v.viewInfo.viewStr, ' (', v.viewInfo.viewNumber, ') ',
                '</span>',
                '<span class="col-md-4 info">',
                    computeSummary(),
                '</span>',
            '</div>'
        ].join('');
    });
    return _.concat('<div class="header col-md-12">', rows, '</div>').join('');
};

function produceResults(videos) {

    _.each(videos, function(v) {
        console.log(_.size(v.related));
    });
};

function printResults() {
    var urinfo = buildAPIURL('results');

    $.getJSON(urinfo.url, function(videos) {
        console.log(`printResults/results: ${urinfo.url} returns ${_.size(videos)} videos`);
        $("#header").html(produceHeader(videos));
        $("#results").html(produceResults(videos));
    });
};
