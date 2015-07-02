
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
tracker:
  debounceCount: 2  
reporter:
  helloDelay: 16000 # send an email 16 seconds after starting
  dailyEnabled: true
  hour: 16 # 16:10 (pm)
  minute: 10
urlMonitor:
  period: 45000 # check every 45 seconds
  timeout: 8000 # connection timeout after 8 seconds
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

### Implementation

#### Triggering alerts

The URLs are checked every `period` e.g. 60 seconds, and the nonzero `debounceCount` is used for debouncing status changes.

If the status changes, then only upon a subsequent recheck, is the alert triggered e.g. 2 minutes later.

See: https://github.com/evanx/chronica-active/blob/master/src/tracker.js


#### Sending alerts

We use `nodemailer` which works out the box for `@gmail.com` addresses.

See: https://github.com/evanx/chronica-active/blob/master/src/Alerts.js


### Other resources

Chronica overview: https://github.com/evanx/chronica

Redex: https://github.com/evanx/redex

Redex utils: https://github.com/evanx/redexutil

Wiki home: https://github.com/evanx/vellum/wiki
