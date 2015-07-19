// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

import YamlDecorator from './YamlDecorator';

const state = {
   configs: new Map(),
   stores: {},
   components: {},
   requiredComponents: new Set(),
   scheduledTimeouts: new Map(),
   scheduledIntervals: new Map()
};

export async function create(rootConfig) {

   async function init() {
      state.defaultConfig = YamlDecorator.readClassDecorationMaybe(module.filename).value;
      logger.info('rootConfig:', Object.keys(rootConfig).join(', '));
      createStores();
      assert(state.stores.environment, 'environment store');
      assert(state.stores.service, 'service status store');
      Object.assign(state.components, state.stores);
      logger.debug('initComponents exclude', Object.keys(state.defaultConfig.defaults));
      state.componentNames = Object.keys(rootConfig).filter(name =>
         !state.defaultConfig.defaults[name]);
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
      logger.debug('initComponents', state.componentNames);
      for (let name of state.componentNames) {
         assert(!state.components[name], 'unique component: ' + name);
         let config = rootConfig[name] || {};
         config.class = config.class || name;
         let componentClassFile = getClassFile('components', config.class);
         config = YamlDecorator.decorateClass(componentClassFile, config);
         if (config.requiredComponents) {
            config.requiredComponents.forEach(required =>
                  state.requiredComponents.add(required));
         } else {
            logger.warn('no requiredComponents', name, config);
         }
         state.configs.set(name, config);
         let component = createComponent(name, config, componentClassFile);
         state.components[name] = component;
      }
   }

   function getClassFile(type, className) {
      let rootDir = path.dirname(module.filename).replace(/\/lib$/, '');
      let classFile =  rootDir  + '/' + type + '/' + className;
      logger.debug('getClassFile', classFile);
      return classFile;
   }

   function createComponent(name, config, componentClassFile) {
      logger.info('createComponent', name, componentClassFile);
      try {
         let componentClass = require(componentClassFile);
         config.loggerLevel = config.loggerLevel || rootConfig.loggerLevel;
         let componentLogger = Loggers.create(name, config.loggerLevel);
         if (path.basename(componentClassFile).match(/^[A-Z]/)) {
            assert(typeof componentClass, 'function', 'Class');
            return new componentClass(config, componentLogger, state);
         } else if (componentClass.create) {
            assert(typeof componentClass.create, 'function', 'Class');
            return componentClass.create(config, componentLogger, state);
         } else {
            throw 'require class or create function: ' + componentClassFile;
         }
      } catch (err) {
         logger.error('createComponent', name, err);
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
      state.startedNames = await* Object.keys(state.components).map(async (name) => {
         let component = state.components[name];
         logger.debug('startComponents', name);
         try {
            startComponent(name, component);
            logger.debug('started', name);
            return name;
         } catch (err) {
            logger.error('startComponents', name, err);
            throw err;
         }
      });
      logger.debug('startedNames:', state.startedNames);
      schedule();
   }

   async function startComponent(name, component) {
      logger.debug('startComponent', name);
      await Promises.timeout('start ' + name, rootConfig.componentStartTimeout,
            component.start());
   }

   function schedule() {
      for (let [name, config] of state.configs) {
         let component = state.components[name];
         assert(component, 'component exists: ' + name);
         if (config.scheduledTimeout) {
            state.scheduledTimeouts.set(name, setTimeout(async () => {
               try {
                  await component.scheduledTimeout();
               } catch (err) {
                  logger.error('scheduledTimeout', {name, err});
               }
            }, config.scheduledTimeout));
            logger.debug('scheduledTimeout', name, config.scheduledTimeout);
         }
         if (config.scheduledInterval) {
            state.scheduledIntervals.set(name, setInterval(async () => {
               try {
                  await component.scheduledInterval();
               } catch (err) {
                  logger.error('scheduledTimeout', {name, err});
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
