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
      add(service) {
         assert(service.name, 'name: ' + Object.keys(service).join(', '));
         if (!service.label) {
            service.label = service.name;
         }
         state.services.set(service.name, service);
      }
   };

   return those;
}
