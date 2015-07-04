// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

import ConfigDecorator from './ConfigDecorator';

var state = {
   components: {},
   scheduledTimeouts: new Map(),
   scheduledIntervals: new Map(),
   services: new Map()
};

export async function create(rootConfig) {

   rootConfig = Object.assign(await ConfigDecorator.read(module.filename), rootConfig);
   state.config = rootConfig;
   state.hostname = state.hostname;
   logger.verbose('rootConfig', rootConfig);

   state.componentNames = lodash(rootConfig.components).filter(config => {
      assert(config.name, 'name: ' + config);
      if (rootConfig.hasOwnProperty(config.name)) {
         return true;
      } else {
         logger.warn('ignore', config.name);
         return false;
      }
   }).map(config => {
      assert(config.class, 'class: ' + config.name);
      logger.debug('configure', config.name);
      let componentClass = require('../components/' + config.class);
      config.loggerLevel = config.loggerLevel || rootConfig.loggerLevel;
      let componentLogger = Loggers.create(config.name, config.loggerLevel);
      config = Object.assign(config, rootConfig[config.name]);
      let component = componentClass.create(config, componentLogger, state.components, state);
      state.components[config.name] = component;
      return config.name;
   }).value();

   async function start() {
      state.startedNames = await* state.componentNames.map(async (name) => {
         logger.debug('start', name);
         await state.components[name].start();
         return name;
      });
      logger.debug('startedNames:', state.startedNames);
   }

   const those = {
      async end() {
         Object.keys(state.scheduledTimeouts).forEach(name => {
            clearTimeout();
         });
         logger.debug('scheduledIntervals', state.scheduledIntervals.size);
         for (let [name, id] of state.scheduledIntervals) {
            logger.debug('scheduledInterval', name);
            clearInterval(id);
         }
         logger.debug('scheduledTimeouts', state.scheduledTimeouts.size);
         for (let [name, id] of state.scheduledTimeouts) {
            logger.debug('scheduledTimeout', name);
            clearTimeout(id);
         }
         lodash(state.startedNames).reverse().forEach(async(name) => {
            try {
               await state.components[name].end();
            } catch (err) {
               logger.warn('end:', name);
            }
         });
      }
   };

   async function init() {
      if (rootConfig.test && rootConfig.test.cancel === true) {
         logger.warn('cancelling');
         await Promises.delay(2000);
      } else if (rootConfig.test && rootConfig.test.end === true) {
         state.scheduledTimeouts.set('testTimeout', setTimeout(() => console.log('testTimeout'), 1000));
         state.scheduledIntervals.set('testInterval', setInterval(() => console.log('testInterval'), 500));
         await Promises.delay(2000);
         await those.end();
      } else {
         await start();
      }
   }

   init();

   return those;
}
