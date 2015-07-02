// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);
const config = global.config;

import report from './report';

function setStatus(service, status, message) {
   logger.info('setStatus', service.name, status, message);
   if (!service.currentStatus) { // no status i.e. app restarted
      service.currentStatus = status;
      service.alertStatus = service.currentStatus;
      service.statusCount = 1000; // arbitrary number exceeding alertCount
   } else if (service.currentStatus === status) { // status unchanged
      service.statusCount += 1;
      if (service.statusCount === config.alert.alertCount) {
         if (service.alertStatus !== service.currentStatus) {
            service.alertStatus = service.currentStatus;
            report.sendAlert('alert ' + service.name + ' ' + status, message);
         }
      }
   } else { // status changed
      service.statusCount = 0;
      service.currentStatus = status;
   }
}

module.exports = { setStatus };
