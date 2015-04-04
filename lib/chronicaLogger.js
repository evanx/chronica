

var lodash = require('lodash');

var Langs = require('./Langs');

var logglyLib = require('loggly');

var loggyClient = logglyLib.createClient({
   token: global.config.loggly.token,
   subdomain: global.config.loggly.subdomain,
   tags: ['chronica-active'],
   json: true
});


class LoggerAdapter {

   contructor(options, delegate) {
      this.options = options;
      this.delegate = delegate;
   }

   debug(message, data) {
      this.delegate.log(options, 'debug', message, data);
   }

   info(message, data) {
      this.delegate.log(options, 'log', message, data);
   }

   warn() {
      this.delegate.log(options, 'warn', message, data);
   }

   error() {
      this.delegate.log(options, 'error', message, data);
   }
}


function chronicaLogger(options) {
   let that = {};

   if (!options.level) {
      options.level = 'info';
   }

   function sliceArguments(args) {
      var array = Array.prototype.slice.call(args);
      return array;
   }

   function toLevelNumber(level) {
      if (level === 'debug') {
         return 1;
      }
      if (level === 'info') {
         return 2;
      }
      if (level === 'warn') {
         return 3;
      }
      if (level === 'error') {
         return 4;
      }
      throw new Error(options.name);
   }

   function isLoggable(level) {
      return toLevelNumber(level) >= toLevelNumber(options.level);
   }

   function log(level, message, data) {
      if (isLoggable(level)) {
         let record = {message, data};
         let tags = [level, options.name];
         let levelLabel = level.toUpperCase();
         if (options.topic) {
            tags.push(options.topic);
            if (data) {
               console.log(levelLabel, options.name, options.topic, options.context, message, data);
            } else {
               console.log(levelLabel, options.name, options.topic, options.context, message);
            }
         } else if (data) {
            console.log(levelLabel, options.name, message, data);
         } else {
            console.log(levelLabel, options.name, message);
         }
         tags.push(message);
         if (options.context) {
            record.context = options.context;
         }
         loggyClient.log(record, tags);
      }
   }

   Langs.assign(that, {
      child: function(topic, context) {
         var opts = Langs.assign({}, options);
         opts.topic = topic;
         opts.context = context;
         log('debug', topic, context);
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
