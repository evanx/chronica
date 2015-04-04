
## Chronica Active - a microservice to monitor urls

See: https://github.com/evanx/chronica-active/blob/master/lib/checkUrls.js


### Chronica

Chronica is envisaged as suite of components and microservices to assist with centralized logging, analytics and monitoring.

The technology stack includes Node, Redis and ReactJS.

This is inspired by an earlier effort which used Java, SQL and AngularJS, namely <a href="https://github.com/evanx/chronic">Chronic</a>, which has been abandoned.


### Sample config file

The initial trivial implementation checks URLs and alerts admins via email when the site goes down or the HTTP response code changes e.g. from 200 to an error response e.g. 500 or 404.

```json
{
   "alerts": {
      "fromEmail": "chronica-alerts@ngena.com",
      "admins": [
          {
             "email": "...@gmail.com"
          }
       ]
   },
   "checkUrls": {
      "period": 60000,
      "alertCount": 2
   },
   "services": [
      {
         "url": "github.com/evanx",
      }
   ]
}
```

Currently the application is hardcoded to load the config file from `/var/chronica/active.json` unless it is specified in the environment variable `CONFIG_FILE.`

See: https://github.com/evanx/chronica-active/blob/master/lib/app-active-chronica.js

We start the app as follows using `pm2.`

```shell
$ cd ~/chronica-active
$ pm2 start lib/app-active-chronica.js
```

### Triggering alerts

The URLs are checked every `period` e.g. 60 seconds, and the nonzero `alertCount` is used for debouncing status changes.

If the status changes, then only upon a subsequent recheck, is the alert triggered e.g. 2 minutes later.

See: https://github.com/evanx/chronica-active/blob/master/lib/Services.js


### Alerts

We use `nodemailer` which works out the box for `@gmail.com` addresses.

See: https://github.com/evanx/chronica-active/blob/master/lib/Alerts.js


### Other resources

Chronica overview: https://github.com/evanx/chronica

Wiki home: https://github.com/evanx/vellum/wiki
