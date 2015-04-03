

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
   });
   request.end();
}

checkUrl('http://iolmobile.co.za');
