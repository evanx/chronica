// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

import report from './report';
import urlMonitor from './urlMonitor';

start().then(() => {
   logger.info('started');
}).catch(err => {
   logger.error(err);
});

async function start() {
   if (!config.cancelled) {
      await urlMonitor.start();
   }
}

async function cancel() {
   await urlMonitor.end();
}
