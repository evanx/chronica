// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

module.exports = {
   create(config, state, reporter) {
      const those = {
         async setStatus(service, status, message) {
            logger.info('setStatus', service.name, status, message);
            if (!service.currentStatus) { // no status i.e. app restarted
               service.currentStatus = status;
               service.alertStatus = service.currentStatus;
               service.statusCount = config.debounceCount;
            } else if (service.currentStatus === status) { // status unchanged
               service.statusCount += 1;
               if (service.statusCount === config.debounceCount) {
                  if (service.alertStatus !== service.currentStatus) {
                     service.alertStatus = service.currentStatus;
                     reporter.sendAlert('alert ' + service.name + ' ' + status, message);
                  }
               }
            } else { // status changed
               service.statusCount = 0;
               service.currentStatus = status;
            }
         }
      };
      return those;
   }
};
