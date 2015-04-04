
var lodash = require('lodash');

var Alerts = require('./Alerts');

function getReport() {
   var urls = lodash.map(global.config.services, function(service) { return service.url });
   return urls.join('\n');
}

Alerts.sendAlert('START', getReport());

if (global.config.dailyReport && global.config.dailyReport.hour !== undefined) {
   setInterval(function() {
      var time = new Date();
      if (time.getHours() === global.config.dailyReport.hour && time.getMinutes() === global.config.dailyReport.minute) {
         global.log.info('daily', time.getHours(), time.getMinutes(), global.config.dailyReport);
         Alerts.sendAlert('DAILY', getReport());
      }
   }, 45000);
}
