
var lodash = require('lodash');
var http = require('http');
var config = require('/var/chronica/active.json');
var log = require('./log')(config, {name: 'chronica-active', level: 'debug'});

log.info('config', config);

function checkHostUrl(host) {
   var options = {
       host: host.url
   };
   var request = http.request(options, function(res) {
      log.info('ok', host.url, JSON.stringify(res));
   });
   request.on('error', function(err) {
      log.error('error', host.url, err);
   });
   request.end();
}

lodash.forEach(config.hosts, function(host, name) {
   host.name = name;
   checkHostUrl(host);
});
