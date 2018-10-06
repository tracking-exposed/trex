import config from '../../config';

require('./sync');
require('./account');
require('./utils');
require('./opener');

if (config.DEVELOPMENT) {
    require('./reloadExtension');
}
