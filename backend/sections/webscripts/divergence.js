function printList() {

    var elements = window.document.location.pathname.split('/');
    var name = elements.pop();
    var testId = elements.pop();

    var url = "/api/v1/sequences/" + testId + "/" + name;
    console.log("fetching", url);

    $.getJSON(url, function(videos) {
        console.log(videos);
        $("#video--list").append('<pre>' + JSON.stringify(videos) + '</pre>');
        $("#humanizedTime").text(videos.humanize);
        $("#tabtime").text(videos.tabtime);
        $("#videoNumber").text(_.size(videos.list));
        $("#authorName").text(videos.producer);
        // XXX append on #video--pretty
    });
};
