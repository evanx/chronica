// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

export function create(config, logger, context) {

   const that = {
   };

   const those = {
      async getPublic() {
         return that;
      },
      async start() {
      },
      async end() {
      },
      async sendAlert(subject, message) {
         that.alertTime = new Date();
         logger.info('sendAlert', {subject, message});
         if (lodash.isEmpty(message)) {
            logger.debug('sendAlert empty message', subject);
         }
         if (lodash.includes(config.disableHostnames, context.stores.environment.hostname)) {
            logger.info('sendAlert excluded', subject, context.stores.environment.hostname);
            return;
         }
         if (!context.components.emailMessenger && !context.components.slackMessenger) {
            logger.error('no messengers');
         }
         if (context.components.emailMessenger) {
            await context.components.emailMessenger.sendAlert(subject, message);
         }
         if (context.components.slackMessenger) {
            await context.components.slackMessenger.sendAlert(subject, message);
         }
      }
   };

   return those;
}
