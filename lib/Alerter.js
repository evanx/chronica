// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

import nodemailer from 'nodemailer';

const logger = Loggers.create(module.filename);

module.exports = {

   create(config) {

      let that = {};

      that.transport = nodemailer.createTransport();

      const those = {

         sendAlert(subject, message) {
            logger.info('sendAlert', {subject, message});
            if (lodash.isEmpty(message)) {
               logger.info('sendAlert empty message', subject);
               message = subject;
            }
            if (lodash.includes(config.disableHostnames, config.hostname)) {
               logger.info('sendAlert excluded', subject, config.hostname);
               return;
            }
            let options = {
               from: config.alert.fromEmail,
               to: config.alert.admins[0].email,
               subject: 'Chronica ' + subject
            };
            if (message) {
               options.text = message;
            }
            return new Promise((resolve, reject) => {
               that.transport.sendMail(options, (error, response) => {
                  if (error) {
                     reject(error);
                  } else {
                     let info = {to: response.envelope.to, subject};
                     logger.info('Message sent', info);
                     resolve(response);
                  }
               }
            });
         }
      };
      return those;
   }
};
