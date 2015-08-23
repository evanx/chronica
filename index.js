// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

if (process.argv.length > 3 && process.argv[3] === 'debug') {
   global.loggerLevel = 'debug';
   console.log('loggerLevel', global.loggerLevel, process.env.loggerLevel);
}
require('babel/register')({stage: 0});
Object.assign(global, require('./util/Utils'));
global.Redis = require('./util/Redis');
global.YamlFiles = require('./util/YamlFiles');
require('./lib/ApplicationConfigurator');
