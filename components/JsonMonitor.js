// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

export default class JsonMonitor {

   constructor(config, logger, context) {
      Object.assign(this, {config, logger, context});
      config.services.forEach(service => {
         if (service.url) {
            if (!service.name) {
               service.name = service.url.replace(/^https?:\/\//, '');
               logger.debug('service.name', service.name);
            }
         }
         assert(service.url, 'service.url');
         assert(service.name, 'service.name');
         if (!service.label) {
            service.label = service.name;
         }
         context.stores.service.add(service);
         logger.debug('service', service);
      });
   }

   async checkServices() {
      for (const [name, service] of this.context.stores.service.services) {
         await this.checkService(service);
      }
   }

   async function checkService(service) {
      try {
         let content = await Requests.request({url: service.url, method: 'get', timeout: this.config.timeout});
         assert(!lodash.isEmpty(content), 'content length');
         this.context.components.tracker.processStatus(service, 'OK');
      } catch (err) {
         this.context.components.tracker.processStatus(service, 'WARN', err.message);
      }
   }

   async pub() {
      return null;
   }

   async start() {
   }

   async end() {
   }

   async scheduledTimeout() {
      await checkServices();
   }

   async scheduledInterval() {
      await checkServices();
   }
}
