// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

export function create(config, logger, components, appState) {

   let that = {};

   logger.debug('config', config);

   Maybe.notEmpty(config.services, 'services').value;
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
      appState.services.set(service.name, service);
      logger.debug('service', service);
   });

   async function checkServices() {
      for (const [name, service] of appState.services) {
         await checkService(service);
      }
   }

   async function checkService(service) {
      let log = logger.method('checkUrl', service.name);
      try {
         let content = await Requests.request({url: service.url, method: 'head', timeout: config.timeout});
         assert(lodash.isEmpty(content), 'empty content');
         components.tracker.processStatus(service, 'OK');
      } catch (err) {
         components.tracker.processStatus(service, 'CRITICAL', err.message);
      }
   }

   const those = {
      async start() {
         assert(config.interval, 'interval');
         assert(!lodash.isEmpty(config.services), 'services');
         logger.info('started', appState.services.size, config.interval);
         await checkServices();
         that.checkIntervalId = setInterval(checkServices, config.interval);
      },
      async end() {
         if (that.checkIntervalId) {
            clearInterval(that.checkIntervalId);
            delete that.checkIntervalId;
         }
      }
   };

   return those;
}
