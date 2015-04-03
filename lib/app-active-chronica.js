
require('babel/register');

global.config = require('/var/chronica/active.json');

var chronicaLogger = require('./chronicaLogger');

global.clog = chronicaLogger({name: 'chronica-active', level: 'debug'});

clog.info('config urls', config.urls);

require('./checkUrls');
