

var lodash = require('lodash');

function processArguments(args) {
   return Array.prototype.slice.call(args);
}

module.exports = function(options) {
   var that = {};

   Object.assign(that, {
      info: function() {
         console.info(processArguments(args));
      }
   });
   return that;
}