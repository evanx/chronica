
## Chronica Active - a microservice to monitor urls

### Background: Chronica suite

Chronica is envisaged as suite of components and microservices to assist with centralized logging, analytics and monitoring.

The technology stack includes Node, Redis and ReactJS.

This is inspired by an earlier effort which used Java, SQL and AngularJS, namely <a href="https://github.com/evanx/chronic">Chronic</a>, which has been abandoned.

See: https://github.com/evanx/chronica


### Installing

See `scripts/run.sh`
```shell
  node index.js ~/.chronica-active.yaml debug | bunyan -o short
```
where we specify the config file.

Also see `scripts/restart.pm2.sh`

### Sample config file

The initial trivial implementation checks URLs and alerts admins via email when the site goes down or the HTTP response code changes e.g. from 200 to an error response e.g. 500 or 404.

```yaml
loggerLevel: debug
alert:
  alertCount: 2
  fromEmail: noreply@my.com
  admins:
  - email: me@my.com
dailyReport:
  enabled: true
  hour: 16
  minute: 10
urlMonitor:
  period: 60000
  timeout: 4000
  services:
  - url: http://google.com
  - url: http://facebook.com
```

### Triggering alerts

The URLs are checked every `period` e.g. 60 seconds, and the nonzero `alertCount` is used for debouncing status changes.

If the status changes, then only upon a subsequent recheck, is the alert triggered e.g. 2 minutes later.

See: https://github.com/evanx/chronica-active/blob/master/src/Services.js


### Sending alerts

We use `nodemailer` which works out the box for `@gmail.com` addresses.

See: https://github.com/evanx/chronica-active/blob/master/src/Alerts.js


### Other resources

Chronica overview: https://github.com/evanx/chronica

Wiki home: https://github.com/evanx/vellum/wiki
