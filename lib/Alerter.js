// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

import EmailMessenger from './EmailMessenger';
import SlackMessenger from './SlackMessenger';

module.exports = {

   create(state, rootConfig, config) {

      assert(config.messengers, 'messengers');

      let that = {
      };

      function createMessenger(type, messengerConfig) {
         if (type === 'email') {
            return EmailMessenger.create(state, rootConfig, messengerConfig);
         } else if (type === 'slack') {
            return SlackMessenger.create(state, rootConfig, messengerConfig);
         } else {
            throw 'messenger: ' + type;
         }
      }

      const those = {
         async start() {
            assert(config.messengers, 'messengers');
            that.messengers = Object.keys(config.messengers).map(type =>
                  createMessenger(type, config.messengers[type]));
            that.messengers.forEach(messenger => messenger.start());
            logger.info('started', that.messengers.length);
         },
         async end() {
            that.messengers.forEach(messenger => messenger.end());
         },
         async sendAlert(subject, message) {
            logger.info('sendAlert', {subject, message});
            if (lodash.isEmpty(message)) {
               logger.debug('sendAlert empty message', subject);
            }
            if (lodash.includes(config.disableHostnames, rootConfig.env.hostname)) {
               logger.info('sendAlert excluded', subject, rootConfig.env.hostname);
               return;
            }
            return await* that.messengers.map(messenger => {
               messenger.sendAlert(subject, message);
            });
         }
      };

      return those;
   }
};
