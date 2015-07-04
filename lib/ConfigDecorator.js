
import assert from 'assert';
import path from 'path';
import lodash from 'lodash';
import util from 'util';

let logger = Loggers.create(module.filename, 'info');

module.exports = {
   async read(file) {
      file = file.replace(/\.js$/, '.yaml');
      assert(Files.existsFileSync(file), 'file: ' + file);
      let content = await YamlFiles.readFile(file);
      logger.debug('read', file, content);
      return content;
   },
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
      if (lodash.isString(decoration)) {
         let file = decoration;
         assert(Files.existsFileSync(file), 'file: ' + file);
         decoration = module.exports.read(file);
      }
      if (decoration.default) {
         config = Object.assign({}, decoration.default, config);
         logger.debug('decorate default', decoration.default, config);
      }
      return config;
   }
};