
import assert from 'assert';
import path from 'path';
import lodash from 'lodash';
import util from 'util';

let logger = Loggers.create(module.filename, 'debug');

const these = {
   getYamlFile(file) {
      file = file.replace(/\.[a-z]+$/, '');
      file += '.yaml';
      return file;
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
         decoration = these.read(file);
      }
      if (decoration.default) {
         config = Object.assign({}, decoration.default, config);
         logger.debug('decorate default', decoration.default, config);
      }
      return config;
   },
   async decorateClass(classFile, config) {
      let yamlFile = these.getYamlFile(classFile);
      let className = path.basename(yamlFile, '.yaml');
      await YamlFiles.readFileSyncMaybe(yamlFile).then(decoration => {
         logger.debug('decoration', Object.keys(decoration), className, yamlFile, decoration);
         if (!decoration.default) {
            logger.warn('no decoration default:', className, yamlFile);
         } else {
            config = Object.assign(config, decoration.default);
         }
      }, err => {
         logger.warn('no decoration:', yamlFile);
      });
      logger.debug('decorated:', yamlFile, config);
      return config;
   }
};

module.exports = these;
