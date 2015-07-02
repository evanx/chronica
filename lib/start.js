// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

import report from './report';
import UrlMonitor from './UrlMonitor';

var state = {
   services: new Map()
};

start().then(() => {
   logger.info('started');
}).catch(err => {
   logger.error(err);
});

async function start() {
   const urlMonitor = UrlMonitor.create(config.urlMonitor, state);
   if (!config.cancelled) {
      await urlMonitor.start();
   }

   async function cancel() {
      await urlMonitor.end();
   }
}
