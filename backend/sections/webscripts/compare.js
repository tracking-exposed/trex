
function fillRecentSlot(item) {
    console.log(item);

    $("#recent").append('<span class="entry">'+JSON.stringify(item)+'/span>');
/*
      const date = moment(item.publicationTime, moment.ISO_8601),
        readableDate = date.format('MMMM Do YYYY, hh:mm a'),
        unixTimestamp = date.format('x'),
        maxStringLength = 150;
*/
          bgColorClass = 'alert-success';
          entryType = 'picture';

      if(_.size(item.texts) && _.some(item.texts, _.size)) {

        /* are sure the texts[].text is order by the longest */
        selectedText = _.first(_.orderBy(item.texts, _.size));
        teaserText = selectedText.length > maxStringLength
          ? selectedText.substring(0, maxStringLength) + '…'
          : selectedText 
        hasText = true;
      }

      let linkslot ="";
      if(_.startsWith(item.permaLink, '/')) 
        linkslot = `<a href="https://facebook.com${item.permaLink}" title="watch" target="_blank" class="small text-link">Go to post</a>`;
      else if(_.startsWith(item.permaLink, 'https://'))
        linkslot = `<a href="${item.permaLink}" title="Go to post" target="_blank" class="small text-link">Go to post</a>`;

      const gridItem = `
        <div class="grid-item ${item.fblinktype || ''}">
          <article class="content ${bgColorClass} d-flex flex-column">
            <header>${entryType || ''}</header>
            <section class="body">
              <span class="small date" data-date="${unixTimestamp}">${readableDate}</span>
              <h4 class="author">${item.source}</h4>
              ${hasText ? `<p class="teaser">${teaserText}</p>` : ''}
            </section>
            <footer>
              <span class="small ${item.postId ? 'post-id' : ''}" data-post-id="${item.postId}">
                ${item.postId ? 'Post Id: #'+item.postId : '#'}
              </span>
              ${linkslot}
            </footer>
          </article>
        </div>
      `;
      $('#recent').append(gridItem);
}

let $grid;

// #recent and #comparison
function initCompare() {

    $.getJSON('/api/v1/last', function(recent) {
        console.log(recent);
        _.each(recent.content, fillRecentSlot);
    });

    initIsotope();
    console.log("finish");
};


function initIsotope() {
  $grid = $('.grid').isotope({
    // set itemSelector so .grid-sizer is not used in layout
    itemSelector: '.grid-item',
    percentPosition: true,
    masonry: {
      // use element for option
      columnWidth: '.grid-sizer'
    },
    getSortData: {
      postId: '[data-post-id parseInt]',
      date: '[data-date parseInt]',
      author: '.author',
    }
  });
}

function filterBy(filter = '*') {
  $grid.isotope({ filter });
}

function sortBy(value = 'original-order') {
  $grid.isotope({ sortBy: value });
}

function downloadCSV() {
  const token = getToken();
  const url = "/api/v1/csv/" + token;
  console.log("downloadCSV from: ", url);
  window.open(url);
}
