// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

import * as YamlAsserts from '../lib/YamlAsserts';

export default class JsonMonitor {

   constructor(config, logger, context) {
      this.config = config;
      this.logger = logger;
      this.context = context;
      this.init();
   }

   init() {
      for (let name in this.config.services) {
         let service = this.config.services[name];
         service.name = name + ':json';
         service.type = 'json';
         assert(service.url, 'service.url');
         assert(service.name, 'service.name');
         if (!service.label) {
            service.label = service.name;
         }
         this.context.stores.service.add(service);
         this.logger.info('service', service.name);
      }
   }

   async checkServices() {
      for (const [name, service] of this.context.stores.service.services) {
         if (service.type === 'json') {
            await this.checkService(service);
         }
      }
   }

   async checkService(service) {
      try {
         let content = await Requests.request({
            url: service.url,
            method: 'get',
            timeout: this.config.timeout,
            json: true
         });
         assert(!lodash.isEmpty(content), 'content length');
         if (service.minLength) {
            assert(lodash.isArray(content), 'array: ' + typeof content);
            assert(lodash.size(content) >= service.minLength, 'minLength: ' + service.minLength);
         }
         if (service.each) {
            for (let item of content) {
               let errors = YamlAsserts.getErrors(service.each, item);
               if (errors.length) {
                  throw 'asserts: ' + errors.join(', ');
               }
            }
         }
         this.logger.verbose('checkService', service.name, typeof content);
         await this.context.components.tracker.processStatus(service, 'OK');
      } catch (err) {
         this.logger.debug('checkService', service.name, err);
         this.context.components.tracker.processStatus(service, 'WARN', err.message);
      }
   }

   async pub() {
      return null;
   }

   async start() {
      this.logger.info('started');
   }

   async end() {
   }

   async scheduledTimeout() {
      this.logger.verbose('scheduledTimeout');
      await this.checkServices();
   }

   async scheduledInterval() {
      this.logger.verbose('scheduledInterval');
      await this.checkServices();
   }
}
