// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

export function create(config, logger, required) {

   let that = {};

   function formatSlackMessage(bot, subject, alertMessage) {
      logger.debug('', {bot, subject, alertMessage})
      let slackMessage =  'Chronica@' + required.stores.environment.hostname + ': *' + subject + '*';
      if (!lodash.isEmpty(alertMessage)) {
         slackMessage += '\n```' + alertMessage + '```';
      }
      return slackMessage;
   }

   async function sendSlack(bot, subject, message) {
      let log = logger.method('sendSlack', bot.name, subject, message);
      let slackMessage = formatSlackMessage(bot, subject, message);
      log.debug('slackMessage', slackMessage);
      try {
         let content = await Requests.request({
            url: bot.url,
            method: 'post',
            body: slackMessage
         });
      } catch (err) {
         log.warn(err);
      }
   }

   const those = {
      async start() {
         assert(config.bots, 'bots');
         config.bots = config.bots.map(bot => {
            assert(bot.url, 'bot.url');
            bot.url = lodash.trim(bot.url);
            if (!bot.name) {
               bot.name = bot.url.replace(/^https?:\/\/([^\/]+).*&channel=%23(.*)/, '$1#$2');
               assert(bot.name, 'bot name from url: ' + bot.url);
            }
            if (!bot.label) {
               bot.label = bot.name;
            }
            logger.debug('bot', bot);
            return bot;
         });
      },
      async end() {
      },
      async sendAlert(subject, message) {
         logger.info('sendAlert', {subject, message});
         if (lodash.isEmpty(message)) {
            logger.debug('sendAlert empty message', subject);
         }
         return await* config.bots.map(bot => {
            sendSlack(bot, subject, message);
         });
      }
   };

   return those;
}
