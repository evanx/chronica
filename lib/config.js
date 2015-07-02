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
   return await YamlFiles.readFile(env.configFile);
}

configure().then(config => {
   global.config = config;
   logger.debug('config', config)
   require('./start');
}).catch(err => {
   logger.error(err);
});
