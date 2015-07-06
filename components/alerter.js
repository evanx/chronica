// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

export function create(config, logger, required) {

   const that = {
   };

   const those = {
      async start() {
      },
      async end() {
      },
      async sendAlert(subject, message) {
         logger.info('sendAlert', {subject, message});
         if (lodash.isEmpty(message)) {
            logger.debug('sendAlert empty message', subject);
         }
         if (lodash.includes(config.disableHostnames, required.stores.environment.hostname)) {
            logger.info('sendAlert excluded', subject, required.stores.environment.hostname);
            return;
         }
         if (!required.components.emailMessenger && !required.components.slackMessenger) {
            logger.error('no messengers');
         }
         if (required.components.emailMessenger) {
            await required.components.emailMessenger.sendAlert(subject, message);
         }
         if (required.components.slackMessenger) {
            await required.components.slackMessenger.sendAlert(subject, message);
         }
      }
   };

   return those;
}
