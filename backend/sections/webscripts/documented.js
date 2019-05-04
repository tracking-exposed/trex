
function updateRender(videoId) {
    const newurl = `/compare/${videoId}`;
    window.location.replace(newurl);
};

function fillRecentSlot(item) {

    console.log(item);
    let h = `
        <div class="recent" onclick="updateRender(${item.videoId})">
            <label>${item.timeago}</label>
            <label>Related: ${item.relatedN}</label> ${item.title}
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

        console.log(results);
        if(_.size(results) == 0) {
            const nope= `
                <p>Nope, a video with such id has been never found among the evidence collected</p>
                <p>Check if is a valid video, here is the composed link: 
                    <a href="https://youtube.com/watch?v=${cId}">https://youtube.com/watch?v=${cId}</a>
                </p>
            `;
            $("#comparison").append(nope);
            return;
        }

        const allrelated = _.flatten(_.map(results, 'related'));
        const hdr = `
            <div class="comparehdr">We are scrutinzing the video:
                <div class="protagonist">${results[0].title}
                    <a target=_blank href="https://www.youtube.com/watch?v=${results[0].videoId}">🞂</a>
                </div>
                Observed by ytTREX adopters: ${_.size(results)} times, and in total we have: ${_.size(allrelated)} related videos.
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
                        Videos present in the related list ${printed} 
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
                        <label>Position in the list:</label>${positions}
                    </span>
                    <br>
                    <span class="video">
                        <label>Video:</label>${relatedVideo.title}
                    </span>
                </div>
            `;
            $('#comparison').append(videoEntry);

        });
    });

    $.getJSON('/api/v1/last', function(recent) {
        _.each(recent.content, fillRecentSlot);
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

        const apologies = `
            <div class="comparehdr">
                <small>
                    This interface is still a work in progress, sorry!
                    <br>
                    Anyhow, is a <a href="https://github.com/tracking-exposed/yttrex/blob/master/backend/sections/webscripts/documented.js">dumb jquery web-app</a> on a AGPL service, feel free to put some effort if you want to play with the data
                </small>
            </div>
        `;
        $("#notes").append(apologies);

        const target = _.find(results[0].related, { videoId: rId });
        const hdr = `
            <div class="centered">Which videos has, among the related, this:
                <div class="protagonist">${target.title}
                    <a target=_blank href="https://www.youtube.com/watch?v=${results[0].videoId}">🞂</a>
                </div>
                from ${target.source}, has been found between the related ${_.size(results)} times.
            </div>
        `;
        $('#related').append(hdr);

        _.each(results, function(watched) {
            const index = _.find(watched.related, { videoId: rId }).index;
            console.log(watched);
            let videoEntry = `
                <div id="${watched.videoId}" class="step">
                    <span class="video">
                        <label>Watched video:</label>${watched.title}
                        <a target=_blank href="https://www.youtube.com/watch?v=${watched.videoId}">🞂</a>
                    </span>
                    <br>
                    <span class="author">
                        <label>Channel:</label>${watched.authorName}
                    </span>
                    <span class="position">
                        <label>Position in the list:</label>${index}
                    </span>
                    <span>
                        <label>Saved on:</label>${new Date(watched.savingTime)}
                    </span>
                </div>
            `;
            $('#related').append(videoEntry);
        });

    });
};

function submit() {
    const submitted = $("#search").val();
    const videoId = submitted.replace(/.*v=/, '');
    if(_.size(videoId) < 9 || _.size(videoId) > 12) return;
    window.location.replace('/related/' + videoId);

}
