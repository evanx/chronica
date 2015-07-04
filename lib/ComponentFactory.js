// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

import ConfigDecorator from './ConfigDecorator';

var state = {
   configs: new Map(),
   components: {},
   requiredComponents: new Set(),
   componentNames: [],
   scheduledTimeouts: new Map(),
   scheduledIntervals: new Map(),
   services: new Map()
};

export async function create(rootConfig) {

   rootConfig = Object.assign(await ConfigDecorator.read(module.filename), rootConfig);
   state.config = rootConfig;
   state.hostname = state.hostname;
   logger.verbose('rootConfig', rootConfig);

   state.componentNames = rootConfig.components.filter(config => {
      config.requires = config.requires || [];
      config.requires.forEach(required => state.requiredComponents.add(required));
      assert(/^\w+$/.test(config.name), 'name: ' + config.name);
      return rootConfig.hasOwnProperty(config.name);
   }).map(config => {
      config.class = config.class || config.name;
      logger.debug('configure', config.name, config.class);
      let componentClass = require('../components/' + config.class);
      config.loggerLevel = config.loggerLevel || rootConfig.loggerLevel;
      let componentLogger = Loggers.create(config.name, config.loggerLevel);
      config = Object.assign(config, rootConfig[config.name]);
      assert(!state.configs.has(config.name), 'unique name: ' + config.name);
      state.configs.set(config.name, config);
      let component = componentClass.create(config, componentLogger, state.components, state);
      state.components[config.name] = component;
      return config.name;
   });
   logger.debug('componentNames', state.componentNames);

   assert(state.requiredComponents.size > 0, 'requiredComponents');
   for (let required of state.requiredComponents) {
      assert(state.configs.has(required), 'required: ' + required);
   }

   async function start() {
      state.startedNames = await* state.componentNames.map(async (name) => {
         logger.debug('start', name);
         await Promises.timeout('start ' + name, 5000, state.components[name].start());
         logger.debug('started', name);
         return name;
      });
      logger.debug('startedNames:', state.startedNames);
      schedule();
   }

   function schedule() {
      for (let [name, config] of state.configs) {
         logger.debug('schedule', name);
         if (config.scheduledTimeout) {
            state.scheduledTimeouts.set(name, setTimeout(() => {
               state.processors[name].scheduledTimeout();
            }, config.scheduledTimeout));
            logger.debug('scheduledTimeout', name, config.scheduledTimeout);
         }
         let scheduledInterval = config.scheduledInterval;
         if (scheduledInterval) {
            state.scheduledIntervals.set(name, setInterval(() => {
               state.processors[name].scheduledInterval();
            }, config.scheduledInterval));
            logger.debug('scheduledInterval', name, config.scheduledInterval);
         }
      }
   }

   const those = {
      async end() {
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
         return lodash(state.startedNames).reverse().map(async (name) => {
            try {
               logger.debug('end', name);
               return await Promises.timeout('end ' + name, 5000, state.components[name].end());
            } catch (err) {
               logger.warn('end:', name);
            }
         });
      }
   };

   async function init() {
      if (rootConfig.test && rootConfig.test.enable == true) {
         if (rootConfig.test.cancel === true) {
            logger.warn('test cancel');
            await Promises.delay(2000);
         } else if (rootConfig.test.end === true) {
            await start();
            logger.warn('test end');
            state.scheduledTimeouts.set('testTimeout', setTimeout(() => console.log('testTimeout'), 1000));
            state.scheduledIntervals.set('testInterval', setInterval(() => console.log('testInterval'), 500));
            await Promises.delay(2000);
            await those.end();
         }
      } else {
         await start();
      }
   }

   await init();

   return those;
}
