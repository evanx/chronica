// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

export function create(rootConfig) {

   const that = {
      hostname: rootConfig.env.hostname
   };

   const those = {
      get hostname() {
         return that.hostname;
      }
   };

   return those;
}
