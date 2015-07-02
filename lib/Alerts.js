// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

import nodemailer from 'nodemailer';

const logger = Loggers.create(module.filename);
const config = global.config;

var transport = nodemailer.createTransport();

function sendAlert(subject, message) {
   logger.info('sendAlert', {subject, message});
   if (lodash.isEmpty(message)) {
      logger.info('sendAlert empty message', subject);
      return;
   }
   if (lodash.includes(config.disableEmailHostnames, config.hostname)) {
      logger.info('sendAlert excluded', subject, config.hostname);
      message = subject;
   }
   let options = {
      from: config.alert.fromEmail,
      to: config.alert.admins[0].email,
      subject: subject
   };
   if (message) {
      options.text = message;
   }
   transport.sendMail(options, function (error, response) {
      if (error) {
         logger.warn('Message failed', error);
      } else {
         var info = {to: response.envelope.to, subject};
         logger.info('Message sent', info);
      }
   });
}

module.exports = { sendAlert };
