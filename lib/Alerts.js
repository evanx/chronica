

var nodemailer = require("nodemailer");

var transport = nodemailer.createTransport();

export function sendAlert(subject, message) {
   global.clog.info('sendAlert', {subject, message});
   let options = {
      from: global.config.alerts.fromEmail,
      to: global.config.alerts.admins[0].email,
      subject: subject
   };
   if (message) {
      options.text = message;
   }
   transport.sendMail(options, function (error, response) {
      if (error) {
         global.clog.warn('Message failed', error, subject);
      } else {
         global.clog.info('Message sent', {envelope: response.envelope, subject});
      }
   });
}
