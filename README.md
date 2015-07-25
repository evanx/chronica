
## Chronica - a Node daemon to monitor urls

This is a minimal solution for monitoring HTTP URL status, and also some JSON and HTML content assertions.

For example, at a specified interval e.g. 45 seconds, we send an HTTP HEAD request and test that the HTTP status code is 200.

A single YAML configuration file is used. There is no database, no history and no fancy graphs (yet).

Alerts are sent to specified email addresses and/or a Slack channel via your Slackbot.

We have a component model that in theory makes Chronica extensible via additional components. These are configurable by name via the main YAML configuration file, i.e. in the same way as the "built-in" components, such as the URL monitor, tracker, alerter, Slack messenger etc.

#### Pros
- YAML configuration
- extensible via a component model
- Slack integration
- built with Node

#### Cons
- too immature for a stable release
- no support for authentication headers (yet)
- no history
- no fancy graphs

#### Work in progress
- JSON content monitoring e.g. expected properties and their types
- HTML content monitoring - currently only page title, but more to come

For HTML monitoring we plan to add tests for:
- meta tags
- content regex
- element content, by CSS selectors

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

#### git submodules

The `util/` and 'scripts/` directories are git submodules.

See `.gitmodules` and `.git/config`

```shell
evans@boromir:~/chronica$ cat .gitmodules
[submodule "util"]
	path = util
	url = https://github.com/evanx/redexutil
[submodule "scripts"]
	path = scripts
	url = https://github.com/evanx/chronica-script
```

These might be, but should not be, `git@github.com` URLs e.g. `git@github.com:evanx/redexutil.git`

That can be fixed as follows.

```shell
cd ~/chronica/util
git remote set-url origin https://github.com/evanx/redexutil
git remote -v

cd ~/chronica/scripts
git remote set-url origin https://github.com/evanx/chronica-scripts
git remote -v

cd ~/chronica
git submodule sync
cat .gitmodules
cat .git/config | grep redexutil
cat .git/config | grep chronica-scripts
```

Alternatively, create them from scratch as follows:
```
git submodule deinit scripts
git submodule deinit util
git submodule add https://github.com/evanx/redexutil util
git submodule add https://github.com/evanx/chronica-scripts scripts
```

### Sample config file

```yaml
loggerLevel: info
alerter:
   elapsedThreshold: 600000 # suppress alerts for 10 minutes (self or peer)
   peers: # suppress alert if any peer alerted in past 10 minutes
      mypeer1:
         url: http://chronica.mypeer1.com/chronica
emailMessenger:
   fromEmail: chronica-alerts@my.com
   admins: # email recipients for alerts
   - email: me@my.com
   - email: other@my.com
slackMessenger:
   bots: # see: https://api.slack.com/slackbot
   - url: https://MY.slack.com/services/hooks/slackbot?token=...
reporter:
   helloDelay: 16000 # send an email 16 seconds after starting
   daily: # send a daily digest of current status of all services
      hour: 16 # 16:10 (pm)
      minute: 10
tracker: # tracks the status and decides if and when the send an email alert
  debounceCount: 2 # status must stay changed during multiple iterations before alert
```

The debounce count is important for debouncing flaky services where we expect suprious errors, and only want to be alerted when the service appears to go down and stay down (or stay up).

We have implemented three monitoring components, namely for
- URL monitoring
- HTML content monitoring e.g. the `<title>` element
- JSON content monitoring e.g. expected properties and their types

```yaml
urlMonitor:
  interval: 45000 # check status every 45 seconds
  timeout: 8000 # HTTP connection timeout after 8 seconds
  services:
    hn: https://news.ycombinator.com
    myserver1: http://myserver1.com
    myserver2: http://myserver2.com
```
where the HTML title check is equivalent to the following `curl` command:
```shell
curl -sIL https://news.ycombinator.com | grep '^HTTP'
```

```yaml
htmlMonitor:
   class: HtmlMonitor
   loggerLevel: debug
   scheduledTimeout: 2000 # initial check after 2 seconds
   scheduledInterval: 45000 # check every 45 seconds
   services:
      google:
         url: http://www.google.com
         content:
            title: "Google"
```
where the HTML title check is equivalent to the following `curl` command:
```shell
curl -sL google.com | grep '<title>' | head -1 | sed 's/.*<title>\([^<]*\).*/\1/'
```

```yaml
jsonMonitor:
   class: JsonMonitor
   loggerLevel: debug
   scheduledTimeout: 2000 # initial check after 2 seconds
   scheduledInterval: 45000 # check every 45 seconds
   services:
      hn-api:
         url: https://hacker-news.firebaseio.com/v0/item/160705.json?print=pretty
         required:
            id: string
            time: integer
            type: string
```

See https://github.com/evanx/chronica/blob/master/sample-config.yaml

### Running

You must create your own configuration file e.g. `~/.chronica.yaml.`

The `scripts/` directory is a submodule, namely https://github.com/evanx/chronica-scripts

These scripts assist with the author's workflow. Consider forking this, and modifying as suits.

The scripts require:
- current working directory is `chronica/` i.e. from `git clone`
- `~/.chronica.yaml` exists, e.g. see `sample/sample-config.yaml`

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

Note that if you use multiple instances with the same config file i.e. monitoring the same endpoints, you can expect duplicate alerts by default. Perhaps use one instance to monitor all your endpoints, and another remote instance to monitor the monitor ;)

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

In the `systemReporter` above, the `disk` is a percentage value, `load` is the current load average, and the `redis` is the current Redis memory usage in megs.


#### Alerting peers

It is possible to deploy multiple instances monitoring the same endpoints, and still avoid duplicate alerts via the following configuration:

```yaml
alerter:
  elapsedThreshold: 300000
  peers:
    server1: http://chronica.server1.com/chronica
```

In this case, Chronica will check its peers before sending an alert. If any of its peers have sent any alerts in the past 5 minutes, then it will suppress the alert.

The `elapsedThreshold` is used for both itself and its remote peers, to suppress alerts for the configured duration after an alert is sent.


### Other documentation

Implementation overview: https://github.com/evanx/chronica/blob/master/lib/readme.md

Component factory overview: https://github.com/evanx/chronica/blob/master/lib/ComponentFactory.md


### Future work

We may copy these components into Redex, our modular/CSP project.

See: https://github.com/evanx/redex


### Other resources

Redex utils: https://github.com/evanx/redexutil

Wiki home: https://github.com/evanx/vellum/wiki
