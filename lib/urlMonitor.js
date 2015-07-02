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

var Services = require('./Services');

const logger = Loggers.create(module.filename);
const rootConfig = global.config;
const config = rootConfig.urlMonitor;

var state = {
   services: new Map()
};

init();

function init() {
   lodash.forEach(config.services, service => {
      if (service.url && service.name) {
         state.services.set(service.name, service);
      } else {
         logger.warn('init', service);
      }
   });
}

async function checkServices() {
   for (const [name, service] of state.services) {
      await checkService(service);
   }
}

async function checkService(service) {
   logger.info('checkService', service.name);
   assert(service.name, 'service.name');
   assert(service.url, 'service.url');
   let log = logger.method('checkUrl', service.name);
   log.debug(service.url);
   try {
      let content = await Requests.request({url: service.url, method: 'head', timeout: config.timeout});
      assert(lodash.isEmpty(content), 'empty content');
      Services.setStatus(service, 'OK');
   } catch (err) {
      Services.setStatus(service, 'CRITICAL', err.message);
   }
}

async function start() {
  assert(!lodash.isEmpty(config.services), 'services');
  await checkServices();
  logger.debug('started', config.services.length, state.services.size, config.period);
  state.checkIntervalId = setInterval(checkServices, config.period);
}

async function end() {
   if (state.checkIntervalId) {
      clearInterval(state.checkIntervalId);
      delete state.checkIntervalId;
   }
}

module.exports = { start, end };
