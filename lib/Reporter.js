// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

module.exports = {

   create(config, state, alerter) {

      let that = {};

      const those = {
         async start() {
            if (config.helloDelay) {
               that.startTimeoutId = setTimeout(() => {
                  alerter.sendAlert('restarted: ' + state.config.env.hostname, those.getReport()).catch(err => {
                     logger.error('send hello:', err);
                  });
               }, config.helloDelay);
            }
            if (config.dailyEnabled) {
               that.dailyIntervalId = setInterval(() => {
                  var time = new Date();
                  if (time.getHours() === config.hour && time.getMinutes() === config.minute) {
                     logger.info('daily', time.getHours(), time.getMinutes(), config);
                     alerter.sendAlert('daily', those.getReport()).catch(err => {
                        logger.error('send daily:', err);
                     });
                  }
               }, 45000);
            }
         },
         end() {
            if (that.dailyIntervalId) {
               clearInterval(that.dailyIntervalId);
            }
         },
         getReport() {
            var urls = lodash.map(state.services, service => {
               if (service.currentStatus) {
                  return [service.currentStatus, service.url].join(' ');
               } else {
                  return service.url;
               }
            });
            return urls.join('\n');
         },
         sendAlert(subject, message) {
            if (message) {
               message += '\n\n' + those.getReport();
            } else {
               message = those.getReport();
            }
            alerter.sendAlert(subject, message);
         }
      }
      return those;
   }
};
