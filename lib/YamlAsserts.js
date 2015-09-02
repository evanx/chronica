import assert from 'assert';
import lodash from 'lodash';

let logger = Loggers.create(module.filename);

export function getPropErrors(asserts, object, key) {
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
   } else if (type === 'object') {
      logger.warn('asserts', key);
   } else if (lodash.isObject(type)) {
      logger.warn('asserts object', key, type, value);
      return getErrors(type, value);
   } else {
      logger.error('getErrors', key, type, value);
      return '' + key + ' type ' + type;
   }
}

export function getErrors(asserts, object) {
   if (!object) {
      return ['empty item'];
   }
   if (asserts.eachProp) {
      return lodash(object).keys().map(key =>
         getErrors(asserts.eachProp, object[key])
      ).flatten().compact().value();
   }
   return lodash(asserts).keys().map(key =>
      getPropErrors(asserts, object, key)
   ).flatten().compact().value();
}
