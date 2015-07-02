/*
Copyright 2015 Evan Summers (twitter @evanxsummers, github.com/evanx)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

var lodash = require('lodash');
var request = require('request');

var Services = require('./Services');

const config = global.config;

var state = {
   services: {}
};

start();

function checkUrl(url) {
   const logger = Loggers.create('checkUrl ' + url);
   request.head(url, function (err, res) {
      var status;
      var message;
      if (err) {
         status = 'CRITICAL';
         message = err.message;
         logger.warn(status, {statusCode: res.statusCode});
      } else {
         if (res.statusCode != 200) {
            status = 'CRITICAL';
            message = 'Status code ' + res.statusCode;
            logger.warn(status, {statusCode: res.statusCode});
         } else {
            status = 'OK';
            logger.info(status);
         }
      }
      var service = state.services[url];
      Services.setStatus(service, status, message);
   });
}

function init() {
   lodash.forEach(config.services, function(service) {
      service.name = service.url;
      service.url = 'http://' + service.url;
      state.services[service.url] = service;
   });
}

function checkUrls() {
   lodash.forEach(config.services, function(service) {
      checkUrl(service.url);
   });
}

function start() {
  init();
  checkUrls();
  state.checkUrlsIntervalId = setInterval(checkUrls, config.checkUrls.period);
}

export function end() {
   if (state.checkUrlsIntervalId) {
      clearInterval(state.checkUrlsIntervalId);
      delete state.checkUrlsIntervalId;
   }
}
