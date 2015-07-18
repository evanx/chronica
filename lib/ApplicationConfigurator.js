// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

import fs from 'fs';
import os from 'os';

const logger = Loggers.create(module.filename);

configure().then(app => {
   logger.info('app configured');
}).catch(err => {
   if (err.stack) {
      logger.error('app', err.stack);
   } else {
      logger.error('app', err);
   }
});

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
   config.loggerLevel = config.loggerLevel || 'info';
   global.loggerLevel = config.loggerLevel;
   logger.info('loggerLevel', global.loggerLevel);
   config.env = env;
   logger.info(Object.keys(config));
   return await require('./ComponentFactory').create(config);
}

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
