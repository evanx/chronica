

var lodash = require('lodash');
var logglyLib = require('loggly');

var loggyClient = logglyLib.createClient({
   token: global.config.loggly.token,
   subdomain: global.config.loggly.subdomain,
   tags: ['chronica-active'],
   json: true
});

function assign(target, source) {
   lodash.forEach(source, function(item, key) {
      target[key] = item;
   });
   return target;
}

class DelegateLogger {

   contructor(options) {
      this.options = options;
   }

   child(childOptions) {
   }

   info() {
   }

   warn() {
   }

   error() {
   }
}

function chronicaLogger(options) {
   var that = {};

   function sliceArguments(args) {
      var array = Array.prototype.slice.call(args);
      return array;
   }

   function log(level, message, data) {
      var record = {message, data};
      var tags = [level, options.name];
      if (options.topic) {
         tags.push(options.topic);
         if (data) {
            console.log(level, options.name, options.topic, options.context, message, data);
         } else {
            console.log(level, options.name, options.topic, options.context, message);               
         }
      } else if (data) {
         console.log(level, options.name, level, message, data);
      } else {
         console.log(level, options.name, level, message);
      }
      tags.push(message);
      if (options.context) {
         record.context = options.context;
      }
      loggyClient.log(record, tags);
   }

   assign(that, {
      child: function(topic, context) {
         var opts = assign({}, options);
         opts.topic = topic;
         opts.context = context;
         log('debug', 'child', {topic, context});
         return chronicaLogger(opts);
      },
      debug: function(message, data) {
         log('debug', message, data);
      },
      info: function(message, data) {
         log('info', message, data);
      },
      warn: function(message, data) {
         log('warn', message, data);
      },
      error: function(message, data) {
         log('error', message, data);
      },
   });

   return that;
}

module.exports = chronicaLogger;
