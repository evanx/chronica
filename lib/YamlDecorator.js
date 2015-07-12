
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
         let errors = Object.keys(decoration.asserts).map(key => {
            try {
               let type = decoration.asserts[key];
               if (key.indexOf('.') > 0) {
                  throw name + ' assert unimplemented: ' + assert;
               } else if (!config.hasOwnProperty(key)) {
                  throw name + ' missing: ' + key;
               }
               let value = config[key];
               if (type === 'string') {
                  assert(typeof value, type, [name, type, typeof value].join(' '));
               } else if (type === 'array') {
                  assert(typeof value, type, [name, type, typeof value].join(' '));
               } else if (type === 'integer') {
                  assert(Number.isInteger(value), type, [name, type].join(' '));
               }
            } catch (err) {
               return err;
            }
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
      YamlFiles.readFileSyncMaybe(yamlFile).then(decoration => {
         logger.debug('decoration', Object.keys(decoration), className, yamlFile, decoration);
         if (!decoration.default) {
            logger.warn('no decoration default:', className, yamlFile);
         } else {
            config = Object.assign(decoration.default, config);
         }
      }, err => {
         logger.warn('no decoration:', yamlFile);
      });
      logger.debug('decorated:', yamlFile, config);
      return config;
   }
};

module.exports = these;
