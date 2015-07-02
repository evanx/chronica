/*
Copyright 2015 Evan Summers (twitter @evanxsummers, github.com/evanx)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

require('babel/register');

var configFile = '/var/chronica/active.json';

if (process.env.CONFIG_FILE) {
   configFile = process.env.CONFIG_FILE;
}

global.config = require(configFile);

var chronicaLogger = require('./chronicaLogger');

global.log = chronicaLogger({name: 'chronica-active', level: 'info'});

global.logger.info('config urls', config.urls);

require('./report');

require('./checkUrls');
