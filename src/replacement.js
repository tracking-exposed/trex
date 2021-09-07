// import config from "./config";

function recommandation_dispatcher(recc, i) {
  // this {recc} might belong to different 'type':
  // 'youtube', 'wikipedia', 'article', 'tiktok', 'url'

  // console.log(recc, i);

  if(recc.type == 'youtube') {
    return make_video_box(recc, i);
  } else if(recc.type == 'article') {
    return make_article_box(recc, i);
  } else {
    // all the type should be embedded
    return max_url_box(recc, i);
  }
}

function max_url_box(ogblob, i) {
  const url_box = document.createElement('div');
  url_box.className = 'video_box';

  const thumb_div = document.createElement('div');
  thumb_div.setAttribute('class', 'thumb_div');

  if(ogblob.image) {
    const video_thumb = document.createElement('img');
    video_thumb.className = 'video_thumb';
    video_thumb.src = ogblob.image;
    thumb_div.append(video_thumb);
  }

  url_box.innerHTML=  `
    <a href="${ogblob.url}">${ogblob.title}</a>
    <br>
    <small>${ogblob.description}</small>
  `;
  url_box.append(thumb_div);
  return url_box
}

function make_article_box(article, i) {
  const article_box = document.createElement('div');
  article_box.className = 'video_box';

  const thumb_div = document.createElement('div');
  thumb_div.setAttribute('class', 'thumb_div');

  const video_thumb = document.createElement('img');
  video_thumb.className = 'video_thumb';
  video_thumb.src = article.image;
  thumb_div.append(video_thumb);

  article_box.innerHTML=  `
    <a href="${article.url}">${article.title}</a>
    <br>
    <small>${article.description}</small>
  `;
  article_box.append(thumb_div);
  return article_box
}

function make_video_box(video, i) {
  // Div whith everything about a video
  const video_box = document.createElement('div');
  video_box.className = 'video_box';

  // Div with thumbnail and video duration
  const thumb_div = document.createElement('div');
  thumb_div.setAttribute('class', 'thumb_div');

  const video_thumb = document.createElement('img');
  video_thumb.className = 'video_thumb';
  video_thumb.src = video.image;
  thumb_div.append(video_thumb);

  /* const video_duration = document.createElement('p');
  video_duration.setAttribute('class', 'time_span');

  // Remove useless '00:' as hour value (we keep it if it is as minute value)
  var formatted_video_duration = video.duration;
  if (formatted_video_duration.startsWith('00:'))
    formatted_video_duration = formatted_video_duration.substring(
      3,
      formatted_video_duration.length,
    );

  video_duration.append(document.createTextNode(formatted_video_duration));
  thumb_div.append(video_duration); */
  video_box.append(thumb_div);

  // Div with uploader name, video title and tournesol score
  const details_div = document.createElement('div');
  details_div.setAttribute('class', 'details_div');

  const video_title = document.createElement('a');
  video_title.className = 'video_title';
  video_title.href = video.url;
  video_title.append(video.title);
  details_div.append(video_title);

  const video_uploader = document.createElement('p');
  video_uploader.className = 'video_text';
  video_uploader.append(video.description);
  details_div.append(video_uploader);

  /*
  const video_score = document.createElement('p');
  video_score.className = 'video_text';
  video_score.append("Any given Text");
  details_div.append(video_score); */

  video_box.append(details_div);
  return video_box;
}

/* recommendation cache, pointers to the HTML elements */
const recache = { alphabeth: null, ycaibar: null };

/* primary invoked function */
export function updateUX(response) {

  if(!recache.alphabeth) {
    const seen = document.getElementsByTagName('ytd-watch-next-secondary-results-renderer');
    if(seen.length == 0) {
      return { status: 'waitForPage' }
    } else if(seen.length > 1) {
      console.log("This is weird!");
    }
    recache.alphabeth = seen[0];
    recache.alphabeth.style.display = 'none';
  }

  const targetElement = recache.alphabeth.parentNode;

  // Verify that YCAI's container has not yet been rendered
  const old_container = document.getElementById('ycai_container');
  if (old_container) {
    console.warn("should this redrawings happen? it shouldn't ever, this check might be removed");
    old_container.remove();
  }

  // Create new container
  const ycai_container = document.createElement('div');
  ycai_container.id = 'ycai_container';

  // Add inline-block div
  const inline_div = document.createElement('div');
  inline_div.setAttribute('class', 'development_link');

  /* add any icon
  const ycai_icon = document.createElement('img');
  ycai_icon.setAttribute('id', 'ycai_icon');
  ycai_icon.setAttribute(
    'src',
    chrome.extension.getURL('rate_now_icon.png'),
  );
  ycai_icon.setAttribute('width', '24');
  inline_div.append(ycai_icon); */

  /*
  const ycai_title = document.createElement('h1');
  ycai_title.id = 'ycai_title';
  ycai_title.append('Recommendation by Youchoose');
  inline_div.append(ycai_title); */

  /*
  const ycai_link = document.createElement('a');
  ycai_link.href = `${config.WEB_ROOT}/trim`;
  ycai_link.className = "development_link";
  ycai_link.append('[TODO: favicons, link type, general UX testing]');
  inline_div.append(ycai_link);
  */

  // Push videos into new container
  const video_box_height = targetElement.children[0].clientHeight;
  const video_box_width = targetElement.children[0].clientWidth;
  console.log(video_box_height, video_box_width);

  response.forEach((recommendation, i) => ycai_container.append(
    recommandation_dispatcher(recommendation, i))
  );
  recache.alphabeth.parentNode.append(ycai_container);

  /* third party coming soon confuguration infos */
  const ycai_third_p = document.createElement('div');
  ycai_third_p.innerHTML= `
    <div style=
    <h4>
      Community recommendation protocol.
    </h4>
    <br>
    <p>
      Currently, a standard protocol does not exist to manage community recommendations. Therefore, we are in an open discussion with the first organization that could potentially interoperate with us: Turnesol, a Switzerland-based academic and free software project that wants to allow community recommendation on youtube videos.
    </p>
    <br>
    <p>
      Their mechanism is described in this paper. Our mechanism is meant to let content creators control the recommendation that appears close to their video, but both of us would benefit from a means to share such a recommendations list.
    </p>
    <br>
    <p>
      We are discussing a protocol specification, so far our proposal is aligned with the API we implemented to fetch recommendations per Youtube Video Id and works in this way:
    </p>
    <br>
    <br>
    <br>
    <i>TODO: URL and format</i>
  `;
  ycai_third_p.id ="ycai_third_party";
  ycai_third_p.style = { display: 'none' };
  ycai_container.parentNode.append(ycai_third_p);
  recache.tournesol = ycai_third_p;

  if(!recache.ycaibar) {
    const bar = document.createElement('div');
    bar.id = 'ycaibar';
    bar.innerHTML = `
      <p>Recommendations logic:</p>
      <button
        id="default-selector-button"
        class="ycai--button"
        onClick="
          (document.getElementsByTagName('ytd-watch-next-secondary-results-renderer')[0].style).display = 'block';
          (document.getElementById('ycai_third_party').style).display = 'none';
          (document.getElementById('ycai_container').style).display = 'none';
          (document.getElementById('default-selector-button').style)['text-decoration'] = 'underline';
        ">
        Propertary algo
        Default
      </button>
      <button 
        id="ycai-selector-button"
        class="ycai--button"
        onClick="
          (document.getElementsByTagName('ytd-watch-next-secondary-results-renderer')[0].style).display = 'none';
          (document.getElementById('ycai_third_party').style).display = 'none';
          (document.getElementById('ycai_container').style).display = 'block';
          (document.getElementById('ycai-selector-button').style)['text-decoration'] = 'underline';
        ">
        Youchoose
      </button>
      <button
        id="thirdparty-selector-button"
        class="ycai--button"
        onClick="
          (document.getElementsByTagName('ytd-watch-next-secondary-results-renderer')[0].style).display = 'none';
          (document.getElementById('ycai_container').style).display = 'none';
          (document.getElementById('ycai_third_party').style).display = 'block';
          (document.getElementById('thirdparty-selector-button').style)['text-decoration'] = 'underline';
        ">
        Community
      </button>
    `;
    /* append to the dom on top of the current viz */
    recache.alphabeth.parentNode.before(bar);
    recache.ycaibar = bar;
  }

  return { status: 'updated' };
}
