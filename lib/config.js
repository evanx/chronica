// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

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
   if (config.loggerLevel) {
      global.loggerLevel = config.loggerLevel;
   }
   logger.info('loggerLevel', global.loggerLevel);
   return config;
}

configure().then(config => {
   global.config = config;
   logger.info(Object.keys(config));
   require('./start');
}).catch(err => {
   logger.error(err);
});
