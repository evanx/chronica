

var alerts = require('./alerts');

function setStatus(service, status, message) {
   if (!service.currentStatus) {
      service.currentStatus = status;
      service.alertStatus = service.currentStatus;
      service.statusCount = 1000;
   } else if (service.currentStatus === status) {
      service.statusCount += 1;
      if (service.statusCount === global.config.checkUrls.alertCount) {
         if (service.alertStatus !== service.currentStatus) {
            service.alertStatus = service.currentStatus;
            alerts.sendAlert('ALERT ' + service.name + ' ' + status, message);
         }
      }
   } else {
      service.statusCount = 0;
      service.currentStatus = status;
   }
}

export { setStatus };
