
/*
 *
 * BACKLOG
 *
 */
function viewAndLikes(d) {
    var h = [
        'likes: ', d.likes, '</br>',
        'dislikes: ', d.dislikes, '</br>',
        'views: ', d.viewStr, '</br>'
    ];
    return h.join('');
};

colorCodes = {};
function generateColorCode(source) {
    var r = 190 + ( 2 * ( source.charCodeAt(0) + source.charCodeAt(1) ) % 65);
    var g = 190 + ( 2 * ( source.charCodeAt(1) + source.charCodeAt(2) ) % 65);
    var b = 190 + ( 2 * ( source.charCodeAt(0) + source.charCodeAt(2) ) % 65);
    _.set(colorCodes, source, 'rgb('+[r,g,b].join(",")+')');
}

function representRelated(memo, r) {

    var cleanSource = r.source.replace(/[\ \? \)\(\}\{\]\[\=\^\&\%\/\#\!\.\-\_\'\|]/g, '');
    var related = [
        '<div class="related">',
            '<small class="index">',
                r.index,
            '</small>',
            '<span class="">',
                r.title,
            '<span>',
            '<span class="source ' + cleanSource + '">',
                r.source,
            '</span>',
        '</div>'
    ];

    if(!_.get(colorCodes, cleanSource))
        generateColorCode(cleanSource);

    memo += related.join('');
    return memo;

};

function parsingError(d) {
    var html = [
        '<div class="error">',
            '<pre>',
                JSON.stringify(d, undefined, 2),
            '</pre>',
        '</div>'
    ];
};

function videoDataHTML(d) {

    if(d.skipped || !d.processed)
        return parsingError(d);

    var html = [
        '<div class="container-fluid data">',
            '<span class="col-md-3">',
                '<span class="saved"> saved ',
                    moment(d.savingTime).format("YYYY-MM-DD HH:mm:ss"),
                    ' (',
                    moment.duration(moment(d.savingTime) - moment()).humanize(),
                    ' ago) [',
                    moment(d.clientTime).format("HH:mm:ss"),
                    ']',
                '</span>',            
                '<h2>',
                    d.title,
                '</h2>',
                '<h3>',
                    viewAndLikes(d),    
                '</h3>',
                '<a target=_blank href="https://www.youtube.com' + d.authorChannel + '">🔗 ',
                    d.authorName,
                '</a>',
                '</span>',
            '<span class="col-md-9 related-list">',
                '<p>Related videos</p>',
                _.reduce(d.related, representRelated, ""),
            '</span>',
        '</div>'
    ];
    _.each(colorCodes, function(ccode, sourceName) {
        $("." + sourceName).css('background-color', ccode);
    });
    return html.join('');
};

/*
 *
 * END OF BACKLOG - start of DIVERGENCIES 
 *
 */

function divergenciesHTML(s) {
    var html = [
        '<div class="container-fluid data">',
            '<pre>',
                JSON.stringify(s, undefined, 2),
            '</pre>',
        '</div>'
    ];
    return html.join('');
};

function selectableVideo(s, i) {
    var html = [
        '<div class="container-fluid data selectable" id="'+ s.id +'">',
            '<span>',
                '<span class="saved"> saved ',
                    moment(s.savingTime).format("YYYY-MM-DD HH:mm:ss"),
                '</span>',
                '<h4>',
                    s.title,
                '</h4>',
                '<a target=_blank href="https://www.youtube.com' + s.authorChannel + '">',
                    s.authorName,
                '</a>',
            '</span>',
        '</div>'
    ];
    /* only at the first video, associate also the col-md-4 fixed position div */
    return html.join('');
};


/* global variables used for the GET below */
var publicKey = null;
var selected = {};

function updateStep() {
    /* this function is call by main() below, 
     * it check the amount of selected video, present in 'selected'
     * and change the */
    var v = _.size(_.keys(selected));
    if(v) {
        $("#step").html("share (" + v + ")");
        if( $("#step").hasClass('glow') == false )
            $("#step").addClass('glow');
    } else {
        $("#step").html("select videos</br>←");
        $("#step").removeClass('rotate');
    }
};

function createUploadSnippet() {

    $("#shoot").append(
        "<input type='text' id='named' class='labelentry' placeholder='give a name to the sequence' />"
    );

    var button = false;
    $("#named").on('input', function() {
        if(!button) {
            $("#shoot").append(
                "<br/>" +
                "<button id='go'>submit</button>"
            );
            $("#go").on('click', performActualUpload);
            button = true;
        }
    });
};

function performActualUpload() {
    var idString = _.join(_.keys(selected), '-');
    var name = encodeURIComponent($("#named").val());
    var url = '/api/v1/sequence/' + publicKey + '/' + idString + '/' + name;
    console.log(url);
    $.getJSON(url, function(results) {
        var produced = window.location.origin + results.url;
        produced += '<p>share the link above</p>';
        $("#replace").html(produced);
        $("#replace").addClass('url');
    });
};

/*
 * 
 * END OF DIVERGENCIES - start of single word jQuery updates
 * -- for example, the codename of the user, or the number of the posts available
 */

function singleWordUpdates(profile, videoN) {
    console.log("Updaring singleWords");
    $("#codename").text(profile.p);
    $("#videonumber").text(videoN);
};


/*
 *
 * END Of single word jQuery updates. and now, the 20 years after of this:
 *
 *      int main(int argc, char **argv, char **envp)
 *
 */
function personalLoader() {
    publicKey = _.last(window.document.location.pathname.split('/'))
    $.getJSON("/api/v1/personal/" + publicKey, function(data) {

        if(data.error === true) {
            $("#whole")
                .html('<div class="text"><h1 class="title highlight">Error: ' + data.message + '</h1></div>');
            return null;
        }

        singleWordUpdates(data.profile, _.size(data.backlog));

        console.log(`personalLoader: received ${_.size(data.sequences)} sequences of video for divergency section`);
        _.each(data.sequences, function(s) {
            $("#divergencies--list").append(divergenciesHTML(s));
        });

        if(!_.size(data.backlog))
            $("#step").text("Error? no video loaded..");
        else 
            console.log("videoDataHTML loading", data.backlog);

        console.log(`personalLoader: received ${_.size(data.backlog)} collected of video for collections & shareable section`);
        _.each(data.backlog, function(d, i) {
            $("#videolist").append(videoDataHTML(d));
            $("#shareable-list").append(selectableVideo(d, i));
        });


        /* jQuery should be case after HTML get updated above */
        _.each(data.backlog, function(s) {
            $("#" + s.id).on('click', function() {
                var elementId = $(this).attr('id');
                if($(this).hasClass('selected')) {
                    _.unset(selected, elementId);
                    $(this).removeClass('selected');
                } else {
                    _.set(selected, elementId);
                    $(this).addClass('selected');
                }
                updateStep();
            });
        });

        $("#step").on('click', function() {
            var v = _.size(_.keys(selected));
            if(v) {
                $("#step").html(createUploadSnippet());
            } else {
                var actualH = $("#step").html();
                $("#step").text("You should select some video!");
                $("#step").addClass("glow");
                setTimeout(function() {
                    $("#step").html(actualH);
                    $("#step").removeClass("glow");
                }, 1000);
            }
           
        });

        /* initalize the side text */
        updateStep();
    });
};
