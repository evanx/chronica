

var lodash = require('lodash');

function processArguments(args) {
   return Array.prototype.slice.call(args);
}

function assign(target, source) {
      lodash.forEach(source, function(item, key) {
         target[key] = item;
      });
      return target;
}

module.exports = function(options) {
   var that = {};

   assign(that, {
      info: function() {
         console.info(options.name, processArguments(arguments));
      }
   });

   return that;
}
