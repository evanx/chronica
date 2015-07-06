// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

export function create(config, logger, components) {

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
         if (lodash.includes(config.disableHostnames, components.environmentRegistry.hostname)) {
            logger.info('sendAlert excluded', subject, components.environmentRegistry.hostname);
            return;
         }
         if (!components.emailMessenger && !components.slackMessenger) {
            logger.error('no messengers');
         }
         if (components.emailMessenger) {
            await components.emailMessenger.sendAlert(subject, message);
         }
         if (components.slackMessenger) {
            await components.slackMessenger.sendAlert(subject, message);
         }
      }
   };

   return those;
}
