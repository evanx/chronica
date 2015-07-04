// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

import ConfigDecorator from './ConfigDecorator';

var state = {
   processors: new Map(),
   services: new Map()
};

module.exports = {

   async start(config) {

      config = Object.assign(await ConfigDecorator.read(module.filename), config);
      logger.debug('config', config);

      state.processorNames = config.processors.map(processorConfig => {
         assert(processorConfig.name, 'name: ' + processorConfig);
         assert(processorConfig.class, 'class: ' + processorConfig.name);
         let processor = require('./' + processorConfig.class);
         state.processors.set(processorConfig.name, processor);
         return processorConfig.name;
      });

      async function end() {
      }


   }

};
