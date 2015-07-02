/*
Copyright 2015 Evan Summers (twitter @evanxsummers, github.com/evanx)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import nodemailer from 'nodemailer';

const logger = Loggers.create(module.filename);
const config = global.config;

var transport = nodemailer.createTransport();

export function sendAlert(subject, message) {
   logger.info('sendAlert', {subject, message});
   let options = {
      from: config.alerts.fromEmail,
      to: config.alerts.admins[0].email,
      subject: subject
   };
   if (message) {
      options.text = message;
   }
   transport.sendMail(options, function (error, response) {
      var info = {to: response.envelope.to, subject};
      if (error) {
         logger.warn('Message failed', error, info);
      } else {
         logger.info('Message sent', info);
      }
   });
}
