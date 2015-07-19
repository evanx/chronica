
import assert from 'assert';
import lodash from 'lodash';

let logger = Loggers.create(module.filename);

export function getErrors(asserts, object) {
   return lodash(Object.keys(asserts)).map(key => {
      let type = asserts[key];
      if (key.indexOf('.') > 0) {
         return key + ' invalid';
      } else if (!object.hasOwnProperty(key)) {
         return key + ' missing';
      }
      let value = object[key];
      if (type === 'string') {
         if (typeof value !== 'string') {
            return key + ' is not a string';
         }
      } else if (type === 'array') {
         if (!lodash.isArray(value)) {
            return key + ' is not an array';
         }
      } else if (type === 'integer') {
         if (!Number.isInteger(value)) {
            return key + ' is not an integer';
         }
      }
   }).compact().value();
}
