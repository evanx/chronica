// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

import YamlDecorator from './YamlDecorator';

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

   async function init() {
      state.defaultConfig = await YamlDecorator.decorateClass(module.filename, {});
      assert(state.defaultConfig.components, 'default components');
      state.config = rootConfig;
      state.hostname = rootConfig.env.hostname;
      logger.verbose('rootConfig', rootConfig);
      await initComponents();
      await resolveRequiredComponents();
      if (rootConfig.test && rootConfig.test.enable == true) {
         await initTest();
      } else {
         await start();
      }
   }

   async function initComponents() {
      state.componentNames = Object.keys(rootConfig).filter(name => {
         assert(/^\w+$/.test(name), 'name: ' + name);
         return state.defaultConfig.components.hasOwnProperty(name);
      });
      await* state.componentNames.map(async (name) => {
         let config = rootConfig[name] || {};
         let defaultComponentConfig = state.defaultConfig.components[name];
         if (!defaultComponentConfig) {
            logger.error('empty defaultComponentConfig', name);
         } else if (defaultComponentConfig.default) {
            config = Object.assign(config, defaultComponentConfig.default);
            if (defaultComponentConfig.requiredComponents) {
               defaultComponentConfig.requiredComponents.forEach(required => state.requiredComponents.add(required));
            }
         } else {
            logger.warn('empty defaultComponentConfig', name);
         }
         logger.info('config1', name, config);
         config.class = config.class || name;
         config.loggerLevel = config.loggerLevel || rootConfig.loggerLevel;
         let classModule = path.dirname(module.filename).replace(/\/lib$/, '') + '/components';
         let classFile =  classModule + '/' + config.class;
         logger.debug('classFile', name, classFile);
         let componentClass = require(classFile + '.js');
         let decoration = YamlDecorator.
         config = await YamlDecorator.decorateClass(classFile, config);
         logger.info('config2', name, config);
         let componentLogger = Loggers.create(name, config.loggerLevel);
         assert(!state.configs.has(name), 'unique name: ' + name);
         config = Object.assign(config, rootConfig[name]);
         logger.info('component config:', name, rootConfig[name], config);
         try {
            let component = componentClass.create(config, componentLogger, state.components, state);
            state.configs.set(name, config);
            state.components[name] = component;
            return Promise
         } catch (reason) {
            logger.error('create', reason);
            throw reason;
         }
      });
   }

   async function resolveRequiredComponents() {
      assert(state.requiredComponents.size > 0, 'requiredComponent');
      for (let required of state.requiredComponents) {
         assert(state.configs.has(required), 'required: ' + required);
      }
   }

   async function start() {
      state.startedNames = await* state.componentNames.map(async (name) => {
         logger.debug('start', name);
         let component = state.components[name];
         logger.debug('start', name, Object.keys(state.components));
         assert(component, 'component: ' + name);
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

   async function initTest() {
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
      } else {
         await start();
      }
   }

   await init(those);

   return those;
}