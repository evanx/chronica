
## Chronica Active - a microservice to monitor urls

This is a lightweight solution for some quick monitoring of URLs. We regularly perform an HTTP HEAD request, and check that we get a 200 response.

Looking forward, we will implement this functionality in Redex: https://github.com/evanx/redex.


### Background

This is inspired by earlier monitoring efforts in Java, namely <a href="https://github.com/evanx/chronic">Chronic</a>, which has been abandoned.


### Installing

```shell
git clone https://github.com/evanx/chronica-active
cd chronica-active
cat package.json
npm install
git submodule init
git submodule update
```
Note we have a submodule dependency on `https://github.com/evanx/redexutil` for generic utils for ES7. (We use ES7 async functions, via Babel.)

### Sample config file

The initial trivial implementation checks URLs and alerts admins via email when the site goes down or the HTTP response code changes e.g. from 200 to an error response e.g. 500 or 404.

```yaml
loggerLevel: info
alerter:
  fromEmail: chronica-alerts@my.com
  admins:
  - email: me@my.com
tracker: # tracks the status and decides if and when the send an email alert
  debounceCount: 2 # status must stay changed during multiple iterations before alert
reporter:
  helloDelay: 16000 # send an email 16 seconds after starting
  dailyEnabled: true # send a daily digest of current status of all services
  hour: 16 # 16:10 (pm)
  minute: 10
urlMonitor:
  interval: 25000 # check status every 45 seconds
  timeout: 8000 # HTTP connection timeout after 8 seconds
  services:
  - url: http://google.com
  - url: http://facebook.com
```

See https://github.com/evanx/chronica-active/blob/master/sample-config.yaml

### Running

You must create your own configuration file e.g. `~/.chronica-active.yaml.`

The `scripts/` are just a guide and won't work unless:
- `bunyan` and `pm2` are installed globally
- `~/chronica-active` exists
- `~/.chronica-active.yaml` exists

See `scripts/run.sh`
```shell
  node index.js ~/.chronica-active.yaml debug | bunyan -o short
```
where we specify the config file.

Also see `scripts/restart.pm2.sh` which includes the following command:
```shell
cd ~/chronica-active
pm2 start index.js --name chronica-active -- ~/.chronica-active.yaml
```

You can tail -f the log file as follows:
```shell
ls --sort=time ~/.pm2/logs/chronica-active-out-13.log | head -1 | xargs tail -f |
    node_modules/bunyan/bin/bunyan -o short
```

### Implementation

#### Checking URLs

We perform an HTTP HEAD request and check that the response has status code 200.

```javascript
async function checkService(service) {
   try {
      let content = await Requests.request({url: service.url, method: 'HEAD',
            timeout: config.timeout});
      assert(lodash.isEmpty(content), 'empty content');
      tracker.processStatus(service, 'OK');
   } catch (err) {
      tracker.processStatus(service, 'CRITICAL', err.message);
   }
}
```
where we perform a `HEAD` request, using an ES7 `async` function.

Note that we use the `redexutil` promise wrapper to `await` the highly-starred `request` NPM module.

See: https://github.com/evanx/chronica-active/blob/master/lib/UrlsMonitor.js

#### Triggering alerts

The URLs are checked every `interval` e.g. 45 seconds, and a non-zero `debounceCount` is used for debouncing status changes.

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

If `debounceCount` is non-zero, then when the status changes, only upon a subsequent recheck, is the alert triggered e.g. 2 minutes later. This can be configured via:
- `debounceCount` - the number of checks with a stable status before triggering an alert
- `interval` - the interval at which checks are performed (i.e. an HTTP HEAD request)

See: https://github.com/evanx/chronica-active/blob/master/lib/Tracker.js


#### Sending alerts

We use `nodemailer` which works out the box for `@gmail.com` addresses.

See: https://github.com/evanx/chronica-active/blob/master/lib/Alerter.js


### Other resources

Chronica overview: https://github.com/evanx/chronica

Redex: https://github.com/evanx/redex

Redex utils: https://github.com/evanx/redexutil

Wiki home: https://github.com/evanx/vellum/wiki
