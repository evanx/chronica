// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

module.exports = {

   create(rootConfig, config, state, tracker) {

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
         state.services.set(service.name, service);
         logger.debug('service', service);
      });

      async function checkServices() {
         for (const [name, service] of state.services) {
            await checkService(service);
         }
      }

      async function checkService(service) {
         let log = logger.method('checkUrl', service.name);
         try {
            let content = await Requests.request({url: service.url, method: 'head', timeout: config.timeout});
            assert(lodash.isEmpty(content), 'empty content');
            tracker.processStatus(service, 'OK');
         } catch (err) {
            tracker.processStatus(service, 'CRITICAL', err.message);
         }
      }

      const those = {
         async start() {
            assert(!lodash.isEmpty(config.services), 'services');
            await checkServices();
            logger.debug('started', state.services.size, config.interval);
            state.checkIntervalId = setInterval(checkServices, config.interval);
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
