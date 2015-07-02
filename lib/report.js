// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

import Alerts from './Alerts';

const { config } = global;

var state = {};

start();

function getReport() {
   var urls = lodash.map(config.services, service => {
      if (service.currentStatus) {
         return [service.currentStatus, service.url].join(' ');
      } else {
         return service.url;
      }
   });
   return urls.join('\n');
}

export function start() {
   setTimeout(function() {
      Alerts.sendAlert('start', getReport());
   }, 10000);
   if (config.dailyReport && config.dailyReport.enabled) {
      state.dailyIntervalId = setInterval(function() {
         var time = new Date();
         if (time.getHours() === config.dailyReport.hour && time.getMinutes() === config.dailyReport.minute) {
            global.logger.info('daily', time.getHours(), time.getMinutes(), config.dailyReport);
            Alerts.sendAlert('daily', getReport());
         }
      }, 45000);
   }
}

export function end() {
   if (state.dailyIntervalId) {
      clearInterval(state.dailyIntervalId);
   }
}

export function sendAlert(subject, message) {
   if (message) {
      message += '\n\n' + getReport();
   } else {
      message = getReport();
   }
   Alerts.sendAlert(subject, message);
}
