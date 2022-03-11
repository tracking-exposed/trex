import home from './home';
import longlabel from './longlabel';
import searches from './searches';
import * as shared from './shared';
import thumbnail from './thumbnail';
import video from './video';
// import uxlang from './uxlang';

/**
 * export all parsers as dictionary
 */

export const parsers = {
  home,
  searches,
  shared: shared.getThumbNailHref,
  longlabel: longlabel.parser,
  thumbnail,
  video,
  search: searches,
};
