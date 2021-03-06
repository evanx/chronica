// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

export function create(config, logger, context) {

   let that = {
      timeoutIds: {},
      intervalIds: {}
   };

   async function formatReport(report) {
      report = [await context.components.serviceReporter.serviceReport(), report];
      report = lodash.flattenDeep(report);
      report = lodash(report).filter(line => typeof line === 'string')
         .map(line => line.replace(/\s\s+/g, ' ')).value();
      logger.info('report', report);
      return report.join('\n');
   }

   async function hello() {
      let report = [await context.components.systemReporter.helloReport()];
      context.components.alerter.sendAlert('Chronica restarted', await formatReport(report)).catch(err => {
         logger.error('send hello:', err.stack);
      });
   }

   async function daily() {
      let report = await context.components.systemReporter.dailyReport();
      logger.info('daily', time.getHours(), time.getMinutes(), config);
      context.components.alerter.sendAlert('DAILY', await formatReport(report)).catch(err => {
         logger.error('send daily:', err);
      });
   }

   async function hourly() {
      let report = await context.components.systemReporter.hourlyReport();
      logger.info('hourly', time.getHours(), time.getMinutes(), config);
      context.components.alerter.sendAlert('HOURLY', await formatReport(report)).catch(err => {
         logger.error('send daily:', err);
      });
   }

   async function minutely() {
      await context.components.systemReporter.minutely();
   }

   async function alertReport(service) {
      let report = await context.components.systemReporter.alertReport();
      return formatReport(report);
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
      } else if (config.hourly && time.getMinutes() === config.hourly.minute) {
         if (!that.hourlyTime || that.hourlyTime < time.getTime() - Millis.fromMinutes(1)) {
            that.hourlyTime = time.getTime();
            hourly();
         }
      } else {
         minutely();
      }
   }

   const those = {
      async pub() {
         return { daily: config.daily, hourly: config.hourly };
      },
      async start() {
         if (config.helloDelay) {
            scheduleHello();
         }
         that.intervalIds.minutely = setInterval(() => {
            try {
               monitor();
            } catch (err) {
               logger.error('minutely:', err);
            }
         }, 55000);
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
      async sendServiceAlert(service, message) {
         let subject = service.status + ' ' + service.name;
         logger.info('sendAlert', subject);
         let report = await alertReport(service);
         if (lodash.isEmpty(message)) {
            message = report;
         } else {
            message += '\n\n' + report;
         }
         let link = null;
         if (context.stores.environment.alertLink) {
            link = context.stores.environment.alertLink + '/' + service.name;
         }
         await context.components.alerter.sendAlert(subject, message, link);
      }
   }
   return those;
}
