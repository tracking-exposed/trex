
function printList() {

    var elements = window.document.location.pathname.split('/');
    var name = elements.pop();
    var testId = elements.pop();
    var url = "/api/v1/sequences/" + testId + "/" + name;
    console.log("fetching", url);

    $.getJSON(url, function(videos) {
        console.log(videos);
        _.each(videos, function(d) {
            $("#video--list").append('<pre>' + JSON.stringify(d) + '</pre>');
        });
    });
};
