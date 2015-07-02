// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

module.exports = {

   create(config, state, reporter) {

      function getEventType(service, status) {
         if (!service.currentStatus) { // no status i.e. app restarted
            service.currentStatus = status;
            service.alertStatus = service.currentStatus;
            service.statusCount = config.debounceCount;
            return 'initial';
         } else if (service.currentStatus === status) { // status unchanged
            service.statusCount += 1;
            if (service.statusCount === config.debounceCount) {
               return 'debounced';
            } else if (service.statusCount < config.debounceCount) {
               return 'debouncing';
            } else {
               return 'unchanged';
            }
         } else { // status changed
            service.statusCount = 0;
            service.currentStatus = status;
            return 'changed';
         }
      }

      function isAlertableEvent(eventType) {
         if (eventType === 'changed' && config.debounceCount === 0) {
            return true;
         } else if (eventType === 'debounced') {
            return true;
         } else {
            return false;
         }
      }

      const those = {
         async setStatus(service, status, message) {
            const log = logger.method('setStatus', service.name + ' ' + status);
            let eventType = getEventType(service, status);
            if (isAlertableEvent(eventType)) {
               if (service.alertStatus !== service.currentStatus) {
                  service.alertStatus = service.currentStatus;
                  reporter.sendAlert('alert ' + service.name + ' ' + status, message);
               } else {
                  log.debug('unchanged', eventType);
               }
            }
         }
      };
      return those;
   }
};
