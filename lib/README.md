
### ComponentFactory

We instantiate components via a factory, which decorates their config using defaults from YAML files.

We read the configuration file e.g. `~/etc/chronica.yaml`

https://github.com/evanx/chronica/blob/master/etc/sample-config.yaml

and decorate this with `ComponentFactory.yaml` defaults.

https://github.com/evanx/chronica/blob/master/lib/ComponentFactory.yaml

We create this factory using this root configuration:

```javascript
export async function create(rootConfig) {

   async function init() {
      await initComponents();
      await resolveRequiredComponents();
      await startComponents();
      await schedule();
```

See: https://github.com/evanx/chronica/blob/master/lib/ComponentFactory.js


### Checking URLs

We perform an HTTP HEAD request and check that the response has status code 200.

```javascript
async function checkService(service) {
   try {
      let content = await Requests.request({url: service.url, method: 'HEAD',
            timeout: config.timeout});
      assert(lodash.isEmpty(content), 'empty content'); // since HEAD, no content
      components.tracker.processStatus(service, 'OK');
   } catch (err) {
      components.tracker.processStatus(service, 'CRITICAL', err.message);
   }
}
```
where we use an ES7 `async` function to `await` the successful `HEAD` request.

Note that we use the `redexutil` promise wrapper to `await` the highly-starred `request` NPM module.

See: https://github.com/evanx/chronica/blob/master/components/urlMonitor.js

#### Triggering alerts

The URLs are checked every `interval` e.g. 45 seconds, and a `debounceCount` is used for debouncing status changes.

```javascript
function getEventType(service, status) {
   if (!service.status) { // no status i.e. app restarted
      return 'initial';
   } else if (service.status !== status) { // status changed
      return 'changed';
   } else { // status unchanged
      if (service.statusCount === config.debounceCount) {
         return 'debounced';
      } else if (service.statusCount < config.debounceCount) {
         return 'debouncing';
      } else {
         return 'unchanged';
      }
   }
}
```

If `debounceCount` is non-zero, then when the status changes, only upon a subsequent recheck, is the alert triggered e.g. 2 minutes later, depending on:
- `debounceCount` - the number of checks with a stable status before triggering an alert
- `interval` - the interval at which checks are performed e.g. 45 seconds

See: https://github.com/evanx/chronica/blob/master/components/tracker.js


#### Sending alerts

We configure an email and Slack messengers for alerts.

```javascript
async sendAlert(subject, message) {
   if (components.emailMessenger) {
      await components.emailMessenger.sendAlert(subject, message);
   }
   if (components.slackMessenger) {
      await components.slackMessenger.sendAlert(subject, message);
   }
}
```

See: https://github.com/evanx/chronica/blob/master/components/alerter.js


#### Slackbot alerts

https://api.slack.com/slackbot

We HTTP POST the message to your Slackbot as follows:

```javascript
async function sendAlert(subject, message) {
   return await* config.bots.map(bot => {
      sendSlack(bot, subject, message);
   });
}

async function sendSlack(bot, subject, message) {
   let slackMessage = formatSlackMessage(bot, subject, message);
   let content = await Requests.request({url: bot.url, method: 'post',
       body: slackMessage});
}
```

See: https://github.com/evanx/chronica/blob/master/components/slackMessenger.js


#### Email alerts

We use `nodemailer` which works out the box for `@gmail.com` addresses.

```javascript
let transport = nodemailer.createTransport();

async function sendEmail(email, subject, message) {
   let options = {
      from: config.fromEmail,
      to: email,
      subject: 'Chronica ' + subject
   };
   if (message) {
      options.text = message;
   }
   return new Promise((resolve, reject) => {
      transport.sendMail(options, (error, response) => {
         if (error) {
            reject(error);
         } else {
            resolve(response);
         }
```

See: https://github.com/evanx/chronica/blob/master/components/emailMessenger.js
