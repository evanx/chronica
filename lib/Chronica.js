// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

import ConfigDecorator from './ConfigDecorator';

var state = {
   components: {},
   services: new Map()
};

module.exports = {

   async start(rootConfig) {

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
         let componentLogger = Loggers.create(config.name, rootConfig.loggerLevel);
         config = Object.assign(config, rootConfig[config.name]);
         let component = componentClass.create(config, componentLogger, state.components, state);
         state.components[config.name] = component;
         return config.name;
      }).value();

      state.startedNames = await* state.componentNames.map(async (name) => {
         logger.debug('start', name);
         await state.components[name].start();
         return name;
      });
      logger.debug('startedNames:', state.startedNames);

      const those = {
         async end() {
            state.startedNames.reverse().forEach(async(name) => {
               try {
                  await state.components[name].end();
               } catch (err) {
                  logger.warn('end:', name);
               }
            });
         }
      };

      return those;
   }

};
