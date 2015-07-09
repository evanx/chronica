
## Chronica - a Node daemon to monitor urls

This is a minimal solution for monitoring URL status (200 or not).

At a specified interval e.g. 45 seconds, we send an HTTP HEAD request to each URL.

A single YAML configuration file is used. There is no database, and no history.

Alerts are sent to specified email addresses and/or a Slack channel via your Slackbot.

Pros:
- YAML configuration
- Slack integration
- built with Node

Cons:
- URL status monitoring only
- no history
- no fancy graphs

---
<img src="http://evanx.github.io/images/chronica/chronica-slack.png" width="800" border="1"/>

---


### Installing

```shell
git clone https://github.com/evanx/chronica &&
  cd chronica &&
  cat package.json &&
  npm install &&
  git submodule init &&
  git submodule update
```
Note we have a submodule dependency on `https://github.com/evanx/redexutil` for generic utils for ES7. (We use ES7 async functions, via Babel.)

Our scripts use `pm2` for process management, and `bunyan` for showing logs.
In order to use these scripts, you should install `bunyan` and `pm2` globally:
```shell
 sudo npm install bunyan pm2 -g
```

The `scripts/` directory is a git submodule: https://github.com/evanx/chronica-scripts

Consider forking the `chronica-scripts` repo via github and then deploy your own copy. Then you can modifiy the scripts for your own purposes.

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
  - url: http://myserver.com
  - url: http://myotherserver.com
```

See https://github.com/evanx/chronica/blob/master/sample-config.yaml


### Running

You must create your own configuration file e.g. `~/.chronica.yaml.`

The `scripts/` are just a guide and won't work as in unless:
- `~/chronica` exists
- `~/.chronica.yaml` exists

See `scripts/run.sh`
```shell
  node index.js ~/.chronica.yaml debug | bunyan -o short
```
where we specify the config file.

Also see `scripts/restart.pm2.sh` which includes the following command:
```shell
cd ~/chronica
pm2 start index.js --name chronica -- ~/.chronica.yaml
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
   port: 8882
```
and proxy as required via NGINX or other.

---

<img src="http://evanx.github.io/images/chronica/chronica-remote.png" width="400" border="1"/>

---

In the `systemReport` above, the `disk` is a percentage value, `load` is the current load average, and the `redis` is the current Redis memory usage in megs.

### Other documentation

Implementation overview: https://github.com/evanx/chronica/blob/master/lib/readme.md

Component factory overview: https://github.com/evanx/chronica/blob/master/lib/ComponentFactory.md


### Future work

We may copy these components into Redex, our modular/CSP project.

See: https://github.com/evanx/redex


### Other resources

Redex utils: https://github.com/evanx/redexutil

Wiki home: https://github.com/evanx/vellum/wiki
