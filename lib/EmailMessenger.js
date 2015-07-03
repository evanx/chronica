// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

import nodemailer from 'nodemailer';

const logger = Loggers.create(module.filename);

module.exports = {

   create(rootConfig, config) {

      assert(config.fromEmail, 'fromEmail');

      let that = {};

      that.transport = nodemailer.createTransport();

      function formatMessage(email, subject, message) {
         return message + '\n\n' + 'Sent by Chronica on ' + rootConfig.env.hostname + ' to ' + email;
      }

      async function sendEmail(email, subject, message) {
         let options = {
            from: config.fromEmail,
            to: email,
            subject: 'Chronica ' + subject
         };
         if (message) {
            options.text = formatMessage(email, subject, message);
         }
         logger.info('sendEmail', email, subject);
         return new Promise((resolve, reject) => {
            that.transport.sendMail(options, (error, response) => {
               if (error) {
                  reject(error);
               } else {
                  logger.debug('Message sent', response.envelope.to, subject);
                  resolve(response);
               }
            });
         });
      }

      const those = {
         async sendAlert(subject, message) {
            logger.info('sendAlert', {subject, message});
            if (lodash.isEmpty(message)) {
               logger.debug('sendAlert empty message', subject);
            }
            if (lodash.includes(config.disableHostnames, rootConfig.env.hostname)) {
               logger.info('sendAlert excluded', subject, rootConfig.env.hostname);
               return;
            }
            return config.admins.map(admin => {
               sendEmail(admin.email, subject, message);
            });
         }
      };

      return those;
   }
};
