
var lodash = require('lodash');

var Alerts = require('./Alerts');

function getReport() {
   var urls = lodash.map(global.config.services, service => {
      if (service.currentStatus) {
         return [service.currentStatus, service.url].join(' ');
      } else {
         return service.url;
      }
   });
   return urls.join('\n');
}

setTimeout(function() {
   Alerts.sendAlert('START', getReport());
}, 10000);

if (global.config.dailyReport && global.config.dailyReport.enabled) {
   setInterval(function() {
      var time = new Date();
      if (time.getHours() === global.config.dailyReport.hour && time.getMinutes() === global.config.dailyReport.minute) {
         global.log.info('daily', time.getHours(), time.getMinutes(), global.config.dailyReport);
         Alerts.sendAlert('DAILY', getReport());
      }
   }, 45000);
}

export function sendAlert(subject, message) {
   if (message) {
      message += '\n\n' + getReport();
   } else {
      message = getReport();
   }
   Alerts.sendAlert(subject, message);
}
