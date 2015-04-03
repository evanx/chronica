

var lodash = require('lodash');
var http = require('http');
var request = require('request');

var alerts = require('./alerts');

var services = {};

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
      if (!service.currentStatus) {
         service.currentStatus = status;
         service.alertStatus = service.currentStatus;
         service.statusCount = 1000;
      } else if (service.currentStatus === status) {
         service.statusCount += 1;
         if (service.statusCount === 2) {
            if (service.alertStatus !== service.currentStatus) {
               service.alertStatus = service.currentStatus;
               alerts.sendAlert('ALERT ' + url + ' ' + status, message);
            }
         }
      } else {
         service.statusCount = 0;
         service.currentStatus = status;
      }
   });
}

function init() {
   lodash.forEach(global.config.services, function(service) {
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
  setInterval(checkUrls, 30000);
}

start();
