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
         this.logger.info('service', name);
         let service = this.config.services[name];
         service.name = name + ':html';
         service.type = 'html';
         assert(service.url, 'service.url');
         assert(service.name, 'service.name');
         if (!service.content) {
            this.logger.warn('no content requirements', service.name);
         }
         if (!service.label) {
            service.label = service.name;
         }
         this.context.stores.service.add(service);
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
      let info = { service: service.name };
      try {
         this.logger.verbose('checkService', service.name);
         let [response, content] = await Requests.response({
            url: service.url,
            method: 'get',
            timeout: this.config.timeout
         });
         assert(!lodash.isEmpty(content), 'content');
         assert.equal(parseInt(response.headers['content-length']), content.length, 'content length');
         assert(lodash.startsWith(response.headers['content-type'], 'text/html'), 'content type');
         if (service.content) {
            if (service.content.title) {
               let titleMatcher = content.match(/<title>(.+)<\/title>/);
               assert(titleMatcher && titleMatcher.length > 1, 'title');
               info.title = lodash.trim(titleMatcher[1]);
               assert.equal(info.title, service.content.title, 'title');
               service.debug = { title: info.title };
            } else {
               this.logger.debug('checkService', service.name, content.length);
            }
         }
         await this.context.components.tracker.processStatus(service, 'OK');
      } catch (err) {
         this.error = info;
         this.error.message = err.message;
         this.error.time = new Date();
         this.logger.verbose('checkService', service.name, err);
         this.context.components.tracker.processStatus(service, 'WARN', err.message);
      }
   }

   async pub() {
      return { error: this.error };
   }

   async start() {
      this.logger.debug('started');
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
