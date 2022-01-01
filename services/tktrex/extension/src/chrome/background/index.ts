import config from '../../config';

require('./sync');
require('./account');

if (config.DEVELOPMENT) {
  require('./reloadExtension');
}
