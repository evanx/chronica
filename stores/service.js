// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

export function create() {

   const state = {
      services: new Map()
   };

   const those = {
      async pub() {
         let reply = {};
         for (let [key, value] of state.services) {
            if (!_.isEmpty(value.message)) {
               reply[key] = value.status + ' ' + value.message;
            } else {
               reply[key] = value.status;
            }
         }
         return reply;
      },
      get services() {
         return state.services;
      },
      add(service) {
         assert(!state.services.has(service.name), 'unique: ' + service.name);
         assert(service.name, 'name: ' + Object.keys(service).join(', '));
         if (!service.label) {
            service.label = service.name;
         }
         state.services.set(service.name, service);
      }
   };

   return those;
}
