// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

export function create(config, logger, required) {

   const that = {
   };

   const those = {
      async start() {
         logger.info('started');
      },
      async end() {
      },
      async redisReport() {
         return [];
      }
   };
   return those;
}
