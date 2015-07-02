// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

module.exports = {

   create(config, state, tracker) {

      config.services.forEach(service => {
         if (service.url) {
            if (!service.name) {
               service.name = service.url.replace(/^https?:\/\//, '');
               logger.debug('service.name', service.name);
            }
         }
         assert(service.url, 'service.url');
         assert(service.name, 'service.name');
         logger.debug('service', service);
      });

      lodash.forEach(config.services, service => {
         if (service.url && service.name) {
            state.services.set(service.name, service);
         } else {
            logger.warn('init', service);
         }
      });

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
            tracker.setStatus(service, 'OK');
         } catch (err) {
            tracker.setStatus(service, 'CRITICAL', err.message);
         }
      }
      
      const those = {
         async start() {
            assert(!lodash.isEmpty(config.services), 'services');
            await checkServices();
            logger.debug('started', config.services.length, state.services.size, config.period);
            state.checkIntervalId = setInterval(checkServices, config.period);
         },
         async end() {
            if (state.checkIntervalId) {
               clearInterval(state.checkIntervalId);
               delete state.checkIntervalId;
            }
         }
      };
      return those;
   }
};
