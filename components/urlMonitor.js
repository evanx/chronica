// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

export function create(config, logger, context) {

   let that = {};

   logger.debug('config', config);

   for (let name in config.services) {
      let service = config.services[name];
      assert(service.url, 'url: ' + name);
      service.name = name;
      service.type = 'url';
      context.stores.service.add(service);
      logger.debug('service', service);
   }

   async function checkServices() {
      for (const [name, service] of context.stores.service.services) {
         await checkService(service);
      }
   }

   async function checkService(service) {
      try {
         let content = await Requests.request({url: service.url, method: 'head', timeout: config.timeout});
         assert(lodash.isEmpty(content), 'empty content'); // HEAD request has empty content
         context.components.tracker.processStatus(service, 'OK');
      } catch (err) {
         if (!err.code && !err.statusCode) {
            logger.warn('checkService', service.name, err);
         }
         context.components.tracker.processStatus(service, 'WARN', err.message);
      }
   }

   const those = {
      async pub() {
         return null;
      },
      async start() {
         assert(config.interval, 'interval');
         assert(!lodash.isEmpty(config.services), 'services');
         logger.info('started', context.stores.service.services.size, config.interval);
         await checkServices();
         that.checkIntervalId = setInterval(checkServices, config.interval);
      },
      async end() {
         if (that.checkIntervalId) {
            clearInterval(that.checkIntervalId);
            delete that.checkIntervalId;
         }
      },
      async scheduledTimeout() {
      },
      async scheduledInterval() {
      }
   };

   return those;
}
