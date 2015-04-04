
# Chronica Active

## Microservice to monitor urls

See: https://github.com/evanx/chronica-active/blob/master/lib/checkUrls.js

### Chronica

Chronica is envisaged as suite of components and microservices for centralized logging, analytics and monitoring.

The technology stack includes Node, Redis and ReactJS.

This is inspired by an earlier effort which used Java, SQL and AngularJS, namely <a href="https://github.com/evanx/chronic">Chronic</a>, which has been abandoned.


### Sample config file

The initial trivial implementation checks URLs and alerts via email e.g. with the HTTP response code changes e.g. from 200 to 404.

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

The URLs are checked every `period` and the nonzero `alertCount` is used for debouncing status changes, e.g. if the status changes, then upon a subsequent check, the alert is triggered.

See: https://github.com/evanx/chronica-active/blob/master/lib/Services.js


### Other resources

Chronica overview: https://github.com/evanx/chronica

Wiki home: https://github.com/evanx/vellum/wiki
