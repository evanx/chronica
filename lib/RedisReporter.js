// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

module.exports = {

   create(state, rootConfig, config) {

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
};