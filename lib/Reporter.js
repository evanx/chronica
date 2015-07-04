// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

module.exports = {

   create(state, rootConfig, config, alerter, systemReporter, serviceReporter) {

      let that = {
         timeoutIds: {},
         intervalIds: {}
      };

      assert(serviceReporter.serviceReport, 'serviceReport: ' + Object.keys(serviceReporter));

      async function formatReport(report) {
         report = [await serviceReporter.serviceReport(), report];
         report = lodash.flattenDeep(report);
         report = lodash(report).filter(line => typeof line === 'string')
         .map(line => line.replace(/\s\s+/g, ' ')).value();
         logger.info('report', report);
         return report.join('\n');
      }

      async function hello() {
         let report = [await systemReporter.helloReport()];
         alerter.sendAlert('Chronica restarted', await formatReport(report)).catch(err => {
            logger.error('send hello:', err.stack);
         });
      }

      async function daily() {
         let report = await systemReporter.dailyReport();
         logger.info('daily', time.getHours(), time.getMinutes(), config);
         alerter.sendAlert('DAILY', await formatReport(report)).catch(err => {
            logger.error('send daily:', err);
         });
      }

      async function hourly() {
         let report = await systemReporter.hourlyReport();
         logger.info('hourly', time.getHours(), time.getMinutes(), config);
         alerter.sendAlert('HOURLY', await formatReport(report)).catch(err => {
            logger.error('send daily:', err);
         });
      }

      async function minutely() {
         await systemReporter.minutely();
      }

      async function alert() {
         let report = await systemReporter.alertReport();
         logger.info('hourly', time.getHours(), time.getMinutes(), config);
         alerter.sendAlert('HOURLY', await formatReport(report)).catch(err => {
            logger.error('send daily:', err);
         });
      }

      function scheduleHello() {
         logger.debug('scheduleHello', config.helloDelay);
         that.timeoutIds.hello = setTimeout(async () => {
            logger.debug('scheduleHello', config.helloDelay);
            if (that.timeoutIds.hello) {
               delete that.timeoutIds.hello;
               try {
                  await hello();
               } catch (err) {
                  logger.error('send hello:', err.stack);
               }
            }
         }, config.helloDelay);
      }

      function monitor() {
         var time = new Date();
         if (config.daily && time.getHours() === config.daily.hour && time.getMinutes() === config.daily.minute) {
            if (!that.dailyTime || that.dailyTime < time.getTime() - Millis.fromMinutes(1)) {
               that.dailyTime = time.getTime();
               daily();
            }
         } else if (config.hourly && time.getMinutes() === config.hourly.hinute) {
            if (!that.hourlyTime || that.hourlyTime < time.getTime() - Millis.fromMinutes(1)) {
               that.hourlyTime = time.getTime();
               hourly();
            }
         } else {
            minutely();
         }
      }

      const those = {
         async start() {
            if (config.helloDelay) {
               scheduleHello();
            }
            that.intervalIds.minutely = setInterval(() => monitor(), 55000);
            logger.info('started');
         },
         async end() {
            Object.keys(that.timeoutIds).forEach(id => {
               clearTimeout(id);
               delete that.timeoutIds[id];
            });
            Object.keys(that.intervalIds).forEach(id => {
               clearInterval(id);
               delete that.intervalIds[id];
            });
         },
         async sendAlert(subject, message) {
            let report = await alertReport();
            if (lodash.isEmpty(message)) {
               message = report;
            } else {
               message += '\n\n' + report;
            }
            alerter.sendAlert(subject, message);
         }
      }
      return those;
   }
};
