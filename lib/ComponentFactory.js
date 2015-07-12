// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

import YamlDecorator from './YamlDecorator';

const state = {
   configs: new Map(),
   stores: {},
   components: {},
   requiredComponents: new Set(),
   componentNames: [],
   scheduledTimeouts: new Map(),
   scheduledIntervals: new Map()
};

export async function create(rootConfig) {

   async function init() {
      state.defaultConfig = YamlDecorator.decorateClassMaybe(module.filename, {});
      assert(state.defaultConfig.components, 'default components');
      logger.verbose('rootConfig', rootConfig);
      createStores();
      assert(state.stores.environment, 'environment store');
      assert(state.stores.service, 'service status store');
      Object.assign(state.components, state.stores);
      await initComponents();
      await resolveRequiredComponents();
      if (rootConfig.test && rootConfig.test.enable == true) {
         await initTest();
      } else {
         await startComponents();
      }
   }

   function createStores() {
      let storeNames = Object.keys(state.defaultConfig.stores);
      logger.debug('createStores', storeNames);
      storeNames.forEach(name => {
         assert(!state.stores[name], 'unique store: ' + name);
         state.stores[name] = createStore(name);
      });
   }

   function createStore(name) {
      let classFile = getClassFile('stores', name);
      try {
         let loadedClass = require(classFile);
         if (path.basename(classFile).match(/^[A-Z]/)) {
            return new loadedClass(rootConfig);
         } else if (loadedClass.create) {
            return loadedClass.create(rootConfig);
         } else {
            throw 'require class or create function: ' + classFile;
         }
      } catch (err) {
         logger.error('createStore', name, storeClassFile, err);
         throw err;
      }
   }

   async function initComponents() {
      state.componentNames = getComponentNames();
      logger.debug('componentNames', typeof state.componentNames);
      await* state.componentNames.map(async (name) => {
         assert(!state.components[name], 'unique component: ' + name);
         YamlDecorator.assert(config, name);
         let config = getComponentDefaultConfig(name);
         config.class = config.class || name;
         let componentClassFile = getClassFile('components', config.class);
         config = YamlDecorator.decorateClassMaybe(componentClassFile, config);
         state.configs.set(name, config);
         state.components[name] = await initComponent(name, config, componentClassFile);
      });
   }

   function getComponentNames() {
      return Object.keys(rootConfig).filter(name => {
         assert(/^\w+$/.test(name), 'name: ' + name);
         assert(!state.configs.has(name), 'unique name: ' + name);
         return state.defaultConfig.components.hasOwnProperty(name);
      });
   }

   function getComponentDefaultConfig(name) {
      let config = rootConfig[name] || {};
      let defaultComponentConfig = state.defaultConfig.components[name];
      if (!defaultComponentConfig) {
         logger.warn('empty defaultComponentConfig', name);
      } else if (defaultComponentConfig.default) {
         config = Object.assign(defaultComponentConfig.default, config);
         if (defaultComponentConfig.requiredComponents) {
            defaultComponentConfig.requiredComponents
               .forEach(required => state.requiredComponents.add(required));
         }
      } else {
         logger.warn('empty defaultComponentConfig', name);
      }
      return config;
   }

   function getClassFile(dir, name) {
      logger.info('getClassFile', dir, name);
      let classModule = path.dirname(module.filename).replace(/\/lib$/, '') + '/' + dir;
      let classFile =  classModule + '/' + name;
      logger.debug('classFile', name, classFile);
      return classFile;
   }

   async function initComponent(name, config, componentClassFile) {
      logger.info('initComponent', name, Object.keys(config));
      try {
         let componentClass = require(componentClassFile);
         config.loggerLevel = config.loggerLevel || rootConfig.loggerLevel;
         let componentLogger = Loggers.create(name, config.loggerLevel);
         if (path.basename(componentClassFile).match(/^[A-Z]/)) {
            return new componentClass(config, componentLogger, state);
         } else if (componentClass.create) {
            return componentClass.create(config, componentLogger, state);
         } else {
            throw 'require class or create function: ' + componentClassFile;
         }
      } catch (err) {
         logger.error('create', err);
         throw err;
      }
   }

   async function resolveRequiredComponents() {
      assert(state.requiredComponents.size > 0, 'requiredComponent');
      logger.debug('requiredComponents', [...state.requiredComponents.keys()]);
      logger.debug('configs', [...state.configs.keys()]);
      for (let required of state.requiredComponents) {
         assert(state.configs.has(required), 'required: ' + required);
      }
   }

   async function startComponents() {
      state.startedNames = await* state.componentNames.map(async (name) => {
         let component = state.components[name];
         logger.debug('start', name, Object.keys(state.components).size);
         assert(component, 'component: ' + name);
         await Promises.timeout('start ' + name, rootConfig.componentStartTimeout,
         state.components[name].start());
         logger.debug('started', name);
         return name;
      });
      logger.debug('startedNames:', state.startedNames);
      schedule();
   }

   function schedule() {
      for (let [name, config] of state.configs) {
         let component = state.components[name];
         assert(component, 'component exists: ' + name);
         if (config.scheduledTimeout) {
            state.scheduledTimeouts.set(name, setTimeout(() => {
               try {
                  component.scheduledTimeout();
               } catch (err) {
                  logger.warn('scheduledTimeout', name, err);
               }
            }, config.scheduledTimeout));
            logger.debug('scheduledTimeout', name, config.scheduledTimeout);
         }
         if (config.scheduledInterval) {
            state.scheduledIntervals.set(name, setInterval(() => {
               try {
                  component.scheduledInterval();
               } catch (err) {
                  logger.warn('scheduledTimeout', name, err);
               }
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
               return await Promises.timeout(name, rootConfig.componentEndTimeout,
                  state.components[name].end());
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
         await startComponents();
         logger.warn('test end');
         state.scheduledTimeouts.set('testTimeout',
            setTimeout(() => console.log('testTimeout'), 1000));
         state.scheduledIntervals.set('testInterval',
            setInterval(() => console.log('testInterval'), 500));
         await Promises.delay(2000);
         await those.end();
      } else {
         await startComponents();
      }
   }

   await init(those);

   return those;
}
