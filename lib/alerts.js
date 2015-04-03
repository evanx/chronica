

var nodemailer = require("nodemailer");
var os = require("os");

export function sendAlert(subject, message) {
   global.clog.info("sendAlert", {subject, message});
   var transporter = nodemailer.createTransport();
   transporter.sendMail({
      from: global.config.alerts.fromUser + "@" + os.hostname(),
      to: global.config.alerts.admins[0].email,
      subject: subject,
      text: message
   }, function (error, response) {
      transporter.close();
      if (error) {
         console.log(error);
      } else {
         console.log("Message sent:", response);
      }
   });
}
