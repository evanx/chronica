// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

import Alerter from './Alerter';
import Reporter from './Reporter';
import Tracker from './Tracker';
import UrlsMonitor from './UrlsMonitor';

var state = {
   config: config,
   services: new Map()
};

start().then(() => {
   logger.info('started');
}).catch(err => {
   logger.error(err);
});

async function start() {
   const alerter = Alerter.create(config.alerter);
   const reporter = Reporter.create(config.reporter, state, alerter);
   const tracker = Tracker.create(config.tracker, state, reporter);
   const urlMonitor = UrlsMonitor.create(config.urlMonitor, state, tracker);

   if (!config.cancelled) {
      await reporter.start();
      await urlMonitor.start();
   }

   async function cancel() {
      await urlMonitor.end();
      await report.end();
   }
}
