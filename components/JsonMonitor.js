// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

export default class JsonMonitor {

   constructor(config, logger, context) {
      this.config = config;
      this.logger = logger;
      this.context = context;
   }

   init() {
      for (let name in this.config.services) {
         let service = this.config.services[name];
         service.name = name;
         service.type = 'json';
         assert(service.url, 'service.url');
         assert(service.name, 'service.name');
         if (!service.label) {
            service.label = service.name;
         }
         this.context.stores.service.add(service);
         this.logger.debug('service', service);
      }
   }

   async checkServices() {
      for (const [name, service] of this.context.stores.service.services) {
         await this.checkService(service);
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
         logger.debug('checkService', service.name, Object.keys(content));
         await this.context.components.tracker.processStatus(service, 'OK');
      } catch (err) {
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
      this.logger.info('scheduledTimeout');
      await this.checkServices();
   }

   async scheduledInterval() {
      this.logger.info('scheduledInterval');
      await this.checkServices();
   }
}
