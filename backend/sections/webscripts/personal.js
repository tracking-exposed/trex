function getPubKey() {
    let t = _.find(window.location.pathname.split('/'), function(e) {
        return _.size(e) >= 40;
    });
    if(!t) console.log("Wrong token length in the URL");
    return t;
}

function buildTable(video) {
    let tbody = "<tr>";
    _.each(video.related, function(r) {
        tbody += `
            <td>
                <small>${r.index}</small>
                ${r.title}
            </td>
        `;
        if((r.index % 4) == 0)
            tbody += "</tr><tr>";
    });

    const h=`
        <table class="table videoblock">
            <thead>
                <tr>
                    <td>
                        ${video.title}
                        <a class="compareLink" href="/compare/${video.videoId}">
                            compare
                        </a>
                    </td>
                    <td>
                        ${video.authorName}
                        <br>
                        <a class="compareLink" href="/author/${video.videoId}">
                            Search by author
                        </a>
                    </td>
                    <td>${video.viewInfo.viewStr}</td>
                    <td>Related: #${video.relatedN}</td>
            </thead>
            ${tbody}
        </table>
    `;
    $("#report").append(h);
};

function addTimeHeader(timestring) {
    const h =`<p class="timeheader">${timestring}</p>`;
    $("#report").append(h);
}

function personal() {
    const pk = getPubKey();
    const url = `/api/v1/personal/${pk}/`;
    console.log("metadata collected, retrieved via: ", url);

    $.getJSON(url, (data) => {
        console.log(data);
        let lastTimed = "";

        _.each(data.metadata, function(video) {
            if(lastTimed != video.relative) {
                addTimeHeader(video.relative);
                lastTimed = video.relative;
            }
            buildTable(video);
        });
    });
}

function downloadCSV() {
  const pk = getPubKey();
  const url = `/api/v1/personal/${pk}/csv`;
  console.log("downloadCSV from: ", url);
  window.open(url);
}


