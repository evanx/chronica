// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

export function create() {

   const state = {
      services: new Map()
   };

   const those = {
      async pub() {
         return state.services;
      },
      get services() {
         return state.services;
      },
      setService(key, service) {
         if (!service.name) {
            if (service.url) {
               service.name = service.url.replace(/^https?:\/\//, '');
               logger.debug('service.name', service.name);
            }
         }
         assert(service.name, 'name');
         if (!service.label) {
            service.label = service.name;
         }
         state.services.set(key, service);
      }
   };

   return those;
}
