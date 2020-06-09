import config from '../../config';

require('./sync');
require('./account');
require('./utils');

if (config.DEVELOPMENT) {
    require('./reloadExtension');
}
