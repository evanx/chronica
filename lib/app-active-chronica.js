
<<<<<<< HEAD
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
=======

var http = require('http');
var config = require('/var/chronica/active.json');
var loggly = require('loggly').createClient({
    token: config.loggly.token,
    subdomain: config.loggly.subdomain,
    tags: ["NodeJS"],
    json:true
});

function checkUrl(url){
   var options = {
       host: url
   };
   var request = http.request(options, function(res) {
      loggly.log('ok', url);
   });
   request.on('error', function(err) {
      loggly.error('error', url, err);
>>>>>>> 0543aec94f4dc696901c88150df8f13f5c92f232
   });
   request.end();
}

<<<<<<< HEAD
lodash.forEach(config.hosts, function(host, name) {
   host.name = name;
   checkHostUrl(host);
});
=======
checkUrl('http://iolmobile.co.za');
>>>>>>> 0543aec94f4dc696901c88150df8f13f5c92f232
