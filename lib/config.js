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

import fs from 'fs';
import os from 'os';

const logger = Loggers.create(module.filename);

function processArgs(env, args) {
   args.forEach(arg => {
      if (arg === 'debug') {
         assert(!env.loggerLevel, 'duplicate loggerLevel');
         env.loggerLevel = 'debug';
      } else if (arg === 'info') {
         assert(!env.loggerLevel, 'duplicate loggerLevel');
         env.loggerLevel = 'info';
      } else if (arg === 'cancel') {
         env.cancelled = true;
      } else if (fs.statSync(arg).isFile()) {
         env.configFile = arg;
      } else {
         throw new Error('argument: ' + arg);
      }
   });
}

async function configure() {
   var env = {
      hostname: os.hostname()
   };
   if (process.env.CONFIG_FILE) {
      env.configFile = process.env.CONFIG_FILE;
   }
   if (process.argv.length > 2) {
      processArgs(env, process.argv.slice(2));
   }
   assert(env.configFile, 'config file');
   assert(lodash.endsWith(env.configFile, '.yaml'), 'YAML config file');
   logger.info('config file', env.configFile);
   let config = await YamlFiles.readFile(env.configFile);
   assert(!lodash.isEmpty(config.urlMonitor), 'urlMonitor');
   assert(!lodash.isEmpty(config.urlMonitor.services), 'urlMonitor.services');
   if (config.loggerLevel) {
      global.loggerLevel = config.loggerLevel;
   }
   logger.info('loggerLevel', global.loggerLevel);
   config.urlMonitor.services.forEach(service => {
      if (service.url) {
         if (!service.name) {
            service.name = service.url.replace(/^https?:\/\//, '');
            logger.debug('service.name', service.name);
         }
      }
      assert(service.url, 'service.url');
      assert(service.name, 'service.name');
      logger.debug('service', service);
   });
   return config;
}

configure().then(config => {
   global.config = config;
   logger.info(Object.keys(config));
   require('./start');
}).catch(err => {
   logger.error(err);
});
