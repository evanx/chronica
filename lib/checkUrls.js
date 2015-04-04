

var lodash = require('lodash');
var request = require('request');

var services = require('./services');

function checkUrl(url) {
   var log = global.clog.child('checkUrl', {url});
   request.head(url, function (err, res) {
      var status;
      var message;
      if (err) {
         status = 'CRITICAL';
         message = err.message;
         log.warn(status, {statusCode: res.statusCode});
      } else {
         if (res.statusCode != 200) {
            status = 'CRITICAL';
            message = 'Status code ' + res.statusCode;
            log.warn(status, {statusCode: res.statusCode});
         } else {
            status = 'OK';
            log.info(status);
         }
      }
      var service = services[url];
      services.setService(service, status, message);
   });
}

function init() {
   lodash.forEach(global.config.services, function(service) {
      service.name = service.url;
      service.url = 'http://' + service.url;
      services[service.url] = service;
   });
}

function checkUrls() {
   lodash.forEach(global.config.services, function(service) {
      checkUrl(service.url);
   });
}

function start() {
  init();
  checkUrls();
  setInterval(checkUrls, global.config.checkUrls.period);
  alerts.sendAlert('START');
}

start();
