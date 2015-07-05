
## Chronica Active - a microservice to monitor urls

This is a lightweight solution for some quick monitoring of URLs.

At a specified interval e.g. 45 seconds, we send an HTTP HEAD request and expect a 200 response.

A single YAML configuration file is used. There is no database, and no history.

Alerts are sent to specified email addresses and/or a Slack channel via your Slackbot.

Pros:
- minimal solution
- built with Node
- YAML configuration
- Slack integration

Cons:
- no history

<hr>
<img src="http://evanx.github.io/images/chronica/chronica-slack.png" width="800" border="1"/>
<hr>


### Installing

```shell
git clone https://github.com/evanx/chronica
cd chronica
cat package.json
npm install
git submodule init
git submodule update
```
Note we have a submodule dependency on `https://github.com/evanx/redexutil` for generic utils for ES7. (We use ES7 async functions, via Babel.)

Our scripts use `pm2` for process management, and `bunyan` for showing logs.
In order to use these scripts, you should install `bunyan` and `pm2` globally:
```shell
 sudo npm install bunyan pm2 -g
```

The `scripts/` are a git submodule: https://github.com/evanx/chronica-scripts

Considering forking the script repo via github and then deploy your own copy. Then you can modifiy the scripts for your own purposes.

If you are a JavaScript developer, fork the main repo, so can make modifications and easily do a pull request via github.

### Sample config file

```yaml
loggerLevel: info
alerter:
slackMessenger:
   bots: # see: https://api.slack.com/slackbot
   - url: https://MY.slack.com/services/hooks/slackbot?token=...
emailMessenger:
   fromEmail: chronica-alerts@my.com
   admins: # email recipients for alerts
   - email: me@my.com
   - email: other@my.com
tracker: # tracks the status and decides if and when the send an email alert
  debounceCount: 2 # status must stay changed during multiple iterations before alert
reporter:
  helloDelay: 16000 # send an email 16 seconds after starting
  daily: # send a daily digest of current status of all services
    hour: 16 # 16:10 (pm)
    minute: 10
urlMonitor:
  interval: 45000 # check status every 45 seconds
  timeout: 8000 # HTTP connection timeout after 8 seconds
  services:
  - url: http://google.com
  - url: http://facebook.com
```

See https://github.com/evanx/chronica/blob/master/sample-config.yaml


### Running

You must create your own configuration file e.g. `~/etc/chronica.yaml.`

The `scripts/` are just a guide and won't work as in unless:
- `~/chronica` exists
- `~/etc/chronica.yaml` exists

See `scripts/run.sh`
```shell
  node index.js ~/etc/chronica.yaml debug | bunyan -o short
```
where we specify the config file.

Also see `scripts/restart.pm2.sh` which includes the following command:
```shell
cd ~/chronica
pm2 start index.js --name chronica -- ~/etc/chronica.yaml
```

You can `tail -f` the log file as follows:
```shell
ls --sort=time ~/.pm2/logs/chronica-out-*.log |
    head -1 | xargs tail -f | bunyan -o short
```

### Recommended deployment configuration

Note that if you use multiple instances with the same config file i.e. monitoring the same endpoints, you can expect duplicate alerts. Rather use one instance to monitor all your endpoints, and another remote instance to monitor the monitor ;)

In order to monitor Chronica remotely, include the following in its config file:
```yaml
expressServer:
   location: /chronica
   port: 8881
```
and proxy as required via NGINX or other.

### Implementation

### ComponentFactory

We instantiate components via a factory, which decorates their config using defaults from YAML files.

We read the configuration file e.g. `~/etc/chronica.yaml` and decorate this with `ComponentFactory.yaml` defaults.

We create this factory using this root configuration:
```javascript
export async function create(rootConfig) {

   async function init() {
      await initComponents();
      await resolveRequiredComponents();
      await startComponents();
      await schedule();
```

We initialise the configured components:
```javascript
   async function initComponents() {
      return await* state.componentNames.map(async (name) => {
```

We start the configured components:
```javascript
   async function startComponents() {
      state.startedNames = await* state.componentNames.map(async (name) => {
         let component = state.components[name];
         await Promises.timeout(name, rootConfig.componentStartTimeout,
                  state.components[name].start());
            return name;
      });
   }
```
where we timeout the components' `start()` async functions.

We schedule a timeout and interval on components, if configured.
```javascript
function schedule() {
   for (let [name, config] of state.configs) {
      if (config.scheduledTimeout) {
         state.scheduledTimeouts.set(name, setTimeout(() => {
            state.processors[name].scheduledTimeout();
         }, config.scheduledTimeout));
      }
      let scheduledInterval = config.scheduledInterval;
      if (scheduledInterval) {
         state.scheduledIntervals.set(name, setInterval(() => {
            state.processors[name].scheduledInterval();
         }, config.scheduledInterval));
```
where we record the ids e.g. to cancel in the event of an orderly shutdown.

```javascript
async end() {
   for (let [name, id] of state.scheduledIntervals) {
      clearInterval(id);
   }
   for (let [name, id] of state.scheduledTimeouts) {
      clearTimeout(id);
   }
   return lodash(state.startedNames).reverse().map(async (name) => {
      try {
         return await Promises.timeout(name, rootConfig.componentEndTimeout,
            state.components[name].end());
      } catch (err) {
         logger.warn('end:', name);
```
where we timeout the components' `end()` async functions.

See: https://github.com/evanx/chronica/blob/master/lib/ComponentFactory.js


#### Checking URLs

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


##### Slack

See: https://api.slack.com/slackbot

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


##### Email

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


### Future work

We expect to copy these components into Redex, our modular/CSP project.

See: https://github.com/evanx/redex


### Other resources

Redex utils: https://github.com/evanx/redexutil

Wiki home: https://github.com/evanx/vellum/wiki
