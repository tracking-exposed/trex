
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

    const compare = window.location.href.split('/').pop();
    console.log(compare);
    $.getJSON('/api/v1/videoId/' + compare, function(results) {

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
            let videoDetails = `
                
            `;
            $('#comparison').append(videoEntry);

        });
    });

    $.getJSON('/api/v1/last', function(recent) {
        _.each(recent.content, fillRecentSlot);
    });
};
