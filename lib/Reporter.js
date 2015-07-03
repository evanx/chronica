// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

module.exports = {

   create(rootConfig, config, state, alerter) {

      let that = {};

      const those = {
         async start() {
            if (config.helloDelay) {
               that.startTimeoutId = setTimeout(() => {
                  alerter.sendAlert('RESTARTED', those.getReport()).catch(err => {
                     logger.error('send hello:', err.stack);
                  });
               }, config.helloDelay);
            }
            if (config.dailyEnabled) {
               that.dailyIntervalId = setInterval(() => {
                  var time = new Date();
                  if (time.getHours() === config.hour && time.getMinutes() === config.minute) {
                     logger.info('daily', time.getHours(), time.getMinutes(), config);
                     alerter.sendAlert('DAILY', those.getReport()).catch(err => {
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
         async getReport() {
            var lines = lodash.map([...state.services], service => {
               if (service.status) {
                  return [service.status, service.url].join(' ');
               } else {
                  return service.url;
               }
            });
            let peakLoad = await Files.readFile('/proc/loadavg');
            let rootDisk = await Files.readFile('/proc/loadavg');
            lines.push(peakLoad);
            lines.push(rootDisk);
            return lines.join('\n');
         },
         sendAlert(subject, message) {
            if (false) {
               if (message) {
                  message += '\n\n' + those.getReport();
               } else {
                  message = those.getReport();
               }
            }
            alerter.sendAlert(subject, message);
         }
      }
      return those;
   }
};
