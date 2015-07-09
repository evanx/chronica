// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

export function create() {

   const state = {
      services: new Map()
   };

   const those = {
      async getPublic() {
         return state;
      },
      get services() {
         return state.services;
      },
      setService(key, service) {
         state.services.set(key, service);
      }
   };

   return those;
}
