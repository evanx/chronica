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

var nodemailer = require("nodemailer");

var transport = nodemailer.createTransport();

export function sendAlert(subject, message) {
   global.log.info('sendAlert', {subject, message});
   let options = {
      from: global.config.alerts.fromEmail,
      to: global.config.alerts.admins[0].email,
      subject: subject
   };
   if (message) {
      options.text = message;
   }
   transport.sendMail(options, function (error, response) {
      var info = {to: response.envelope.to, subject};
      if (error) {
         global.log.warn('Message failed', error, info);
      } else {
         global.log.info('Message sent', info);
      }
   });
}
