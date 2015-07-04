// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

import Alerter from './Alerter';
import Reporter from './Reporter';
import Tracker from './Tracker';
import UrlMonitor from './UrlMonitor';
import SystemReporter from './SystemReporter';
import ServiceReporter from './ServiceReporter';

var state = {
   processors: {},
   services: new Map()
};

module.exports = {

   async start(config) {

      state.processors.serviceReporter = ServiceReporter.create(state, config,
         config.reporter.service);

      state.processors.systemReporter = SystemReporter.create(state, config,
         config.reporter.system);

      state.processors.alerter = Alerter.create(state, config,
         config.alerter);

      state.processors.reporter = Reporter.create(state, config,
         config.reporter,
         state.processors.alerter,
         state.processors.systemReporter,
         state.processors.serviceReporter);

      state.processors.tracker = Tracker.create(state, config,
         config.tracker,
         state.processors.reporter);

      state.processors.urlMonitor = UrlMonitor.create(state, config,
         config.urlMonitor,
         state.processors.tracker);

      if (!config.cancelled) {
         await state.processors.serviceReporter.start();
         await state.processors.systemReporter.start();
         await state.processors.alerter.start();
         await state.processors.reporter.start();
         await state.processors.tracker.start();
         await state.processors.urlMonitor.start();
      }

      async function end() {
         await state.processors.urlMonitor.end();
         await state.processors.tracker.end();
         await state.processors.reporter.end();
         await state.processors.alerter.end();
         await state.processors.systemReporter.end();
         await state.processors.serviceReporter.end();
      }
   }
};
