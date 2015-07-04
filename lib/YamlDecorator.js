
import assert from 'assert';
import lodash from 'lodash';
import util from 'util';

const logger = Logger.create(module.filename);

const ConfigDecorator = {
   assert(decoration, config, name) {
      if (decoration.asserts) {
         decoration.asserts.forEach(key => {
            if (key.indexOf('.') > 0) {
               logger.warn('assert unimplemented: ' + assert);
               return;
            } else {
               if (config[key]) {
                  return;
               }
            }
            throw {
               name: logger.name,
               message: util.format('Missing %s %s', name, key),
            };
         });
      }
   },
   decorate(decoration, config) {
      if (decoration.default) {
         config = Object.assign({}, decoration.default, config);
         //logger.debug('decorate', decoration.default, config);
      }
      return config;
   }
};

module.exports = RedexConfigDecorations;
