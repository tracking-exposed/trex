
function fillRecentSlot(item) {
    let h = `
        <div class="recent">
            <label>${item.timeago}</label>
            <label>Related: ${item.relatedN}</label>
            <a class="linked" href="/compare/${item.videoId}">${item.title}</a>
        </div>
    `;
    $('#recent').append(h);
}

// #recent and #comparison
// with 'last' we populate some snippet
// with 'getVideoId' we get the videos, it is display the different comparison
function initCompare() {
    const cId = window.location.href.split('/').pop();
    if(cId == 'compare') return;
    $.getJSON('/api/v1/videoId/' + cId, function(results) {

        if(_.size(results) == 0) {
            const nope= `
                <h3 class="fullred">Nope, this video has never been watched by someone with ytTREX extension</h3>
                <p>Check if is a valid video, here is the composed link: 
                    <a href="https://youtube.com/watch?v=${cId}">https://youtube.com/watch?v=${cId}</a>
                </p>
            `;
            $("#comparison").append(nope);
            return;
        }

        const allrelated = _.flatten(_.map(results, 'related'));
        const hdr = `
            <div class="comparehdr"><div class="fullred">${_.size(results)} times has been seen this video, and YT gave ${_.size(allrelated)} related videos</div>
                <div class="protagonist">
                    <a href="/related/${results[0].videoId}">${results[0].title}</a>,
                    <br/>
                    <a href="/api/v1/videoCSV/${results[0].videoId}">[download CSV]<a>, <a target=_blank href="https://www.youtube.com/watch?v=${results[0].videoId}">[re-play 🞂]</a>
                </div>
            </div>
        `;
        $('#comparison').append(hdr);

        const x = _.reverse(_.orderBy(_.groupBy(allrelated, 'videoId'), _.size));

        let lastH = null;
        _.each(x, function(relatedList) {

            if(_.size(relatedList) != lastH) {
                lastH = _.size(relatedList);
                let printed = lastH > 1 ? lastH + " times" : "once";
                let sightenings = `
                    <div class="seen">
                        Videos present among the "related list" ${printed}:
                    </div>
                `;
                $('#comparison').append(sightenings);
            }

            const positions = _.join(_.map(relatedList, 'index'), ', ');
            const relatedVideo = _.first(relatedList);
            let videoEntry = `
                <div id="${relatedVideo.videoId}" class="step">
                    <span class="author">
                        <label>Channel:</label>${relatedVideo.source}
                    </span>
                    <span class="position">
                        <label>Positions:</label>${positions}
                    </span>
                    <span class="video">
                        <label>Video:</label><a class="linked" href="/related/${relatedVideo.videoId}">${relatedVideo.title}</a>
                        <a target=_blank href="https://www.youtube.com/watch?v=${relatedVideo.videoId}">🞂</a>
                    </span>
                </div>
            `;
            $('#comparison').append(videoEntry);
        });
        /* this repetition of the mouseover/mouseout should really be clean */
        $(".linked").mouseover(function() {
            $(this).addClass('lighton');
        });
        $(".linked").mouseout(function() {
            $(this).removeClass('lighton');
        });
    });

    $.getJSON('/api/v1/last', function(recent) {
        _.each(recent.content, fillRecentSlot);
        $(".linked").mouseover(function() {
            $(this).addClass('lighton');
        });
        $(".linked").mouseout(function() {
            $(this).removeClass('lighton');
        });
    });


};

function initRelated() {
    const rId = window.location.href.split('/').pop();
    if(rId == 'compare') return;
    $("#search").val(rId);
    $.getJSON('/api/v1/related/' + rId, function(results) {
        if(_.size(results) === 0) {
            const nope= `
                <p>Nope, a video with such id has been never found among the evidence collected</p>
                <p>Check if is a valid video, here is the composed link: 
                    <a href="https://youtube.com/watch?v=${rId}">https://youtube.com/watch?v=${rId}</a>
                </p>
            `;
            $("#notes").append(nope);
            return;
        }

        const target = _.find(results[0].related, { videoId: rId });
        const hdr = `
            <div class="centered protagonist">
                <div class="fullred">${_.size(results)} videos linked to this
                    <a class="notclassiclink" href="/compare/${rId}">→  compare</a>
                </div>
                <div>${target.title}
                    <a target=_blank href="https://www.youtube.com/watch?v=${results[0].videoId}">🞂</a>
                </div>
                ${target.source}
            </div>
            <div class="centered fullred">Check the list below</div>
        `;
        $('#related').append(hdr);

        _.each(results, function(watched) {
            const index = _.find(watched.related, { videoId: rId }).index;
            let videoEntry = `
                <div id="${watched.videoId}" class="step">
                    <span class="video">
                        <label>Primary video:</label><a class="primary" href="/compare/${watched.videoId}">${watched.title}</a>
                        <a target=_blank href="https://www.youtube.com/watch?v=${watched.videoId}">🞂</a>
                    </span>
                    <span class="author">
                        <label>Primary channel:</label>${watched.authorName}
                    </span>
                    <span class="position">
                        <label>Position:</label>${index}
                    </span>
                    <span>
                        <label>Saved on:</label>${watched.timeago} ago
                    </span>
                </div>
            `;
            $('#related').append(videoEntry);
        });

        $(".primary").mouseover(function() {
            $(this).addClass('lighton');
        });
        $(".primary").mouseout(function() {
            $(this).removeClass('lighton');
        });
    });
};

function submit() {
    const submitted = $("#search").val();
    const videoId = submitted.replace(/.*v=/, '');
    if(_.size(videoId) < 9 || _.size(videoId) > 12) return;
    window.location.replace('/related/' + videoId);
}

function unfoldRelated(memo, e) {
    let add = `<span class="related">
            ${e.index} < <a href="/related/${e.videoId}">${e.title}</a>
            <a target=_blank href="https://www.youtube.com/watch?v=${e.videoId}">🞂</a>
        </span>
    `;
    memo += add;
    return memo;
};

function initLast() {
    $.getJSON('/api/v1/last', function(recent) {
        _.each(recent.content, function(item) {
            let relates = _.reduce(item.related, unfoldRelated, "");
            let h = `
                <div class="last">
                    <label>${item.timeago}</label>
                    <a class="title" href="/compare/${item.videoId}">${item.title}</a> 
                    <a target=_blank href="https://www.youtube.com/watch?v=${item.videoId}">🞂</a>
                    <div>${relates}</div>
                </div>
            `;
            $('#recent').append(h);
        });

        $(".related").mouseover(function() {
            $(this).addClass('lighton');
        });
        $(".related").mouseout(function() {
            $(this).removeClass('lighton');
        });

    });
};

