// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

import * as YamlAsserts from '../lib/YamlAsserts';

export default class HtmlMonitor {

   constructor(config, logger, context) {
      this.config = config;
      this.logger = logger;
      this.context = context;
      this.init();
   }

   init() {
      for (let name in this.config.services) {
         let service = this.config.services[name];
         service.name = name;
         service.type = 'html';
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
         if (service.type === 'html') {
            await this.checkService(service);
         }
      }
   }

   async checkService(service) {
      try {
         let content = await Requests.request({
            url: service.url,
            method: 'get',
            timeout: this.config.timeout
         });
         assert(!lodash.isEmpty(content), 'content length');
         this.logger.info('checkService', service.name, content.length);
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
