
function printList() {

    var testId = _.last(window.document.location.pathname.split('/'))
    $.getJSON("/api/v1/sequences/" + testId, function(videos) {
        console.log(videos);
        _.each(videos, function(d) {
        });
    });
};
