
# chronica - microservice-based monitoring

Chronica is envisaged as a simple secure monitoring solution using Node.js and Redis.

This is a Node redesign of my abandoned Java <a href="https://github.com/evanx/chronic">Chronic</a> project.

It's a design/work in progress, as a side-project.
 

### Background: Chronic

The intial problem that prompted Chronic, was my receiving many overnight cronjob emails, from custom backup scripts etc. And wanting to use cron scripts for monitoring security-related information.

Chronic was a Java monitoring server whereby client machines can post output e.g. from shell scripts, to this server. This text is diff'ed to the previous posting e.g from the previous day, and then sending a notification when the content has changed. This enabled any custom monitoring scripts to be run via cron, e.g. every minute, or every day.

An extensible client bash script was developed, which included various standard checks. More importantly, it enabled custom checks. It piped the output of "checks" into `curl` in order to HTTPS POST information to the server via secure SSL. Email notifications would include HTTPS links to view the text securely via browser, with Mozilla Persona authentication.

Anyway, the Chronic server was a terribly monolithic Java/SQL application, with an Angular front-end. Anyway, I abandoned that project within a few months, about a year ago.

But monitoring is fun. Chronica will re-imagine that solution, and implement it using Node microservices, Redis and ReactJS.


### Related services

https://github.com/evanx/certserver - certificate enrollment, management and authentication


### Other resources

Wiki home: https://github.com/evanx/vellum/wiki

