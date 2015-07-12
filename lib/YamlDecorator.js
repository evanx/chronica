
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
         if (errors.length) {
            logger.warn('assert', name, errors);
            throw name + ' asserts: ' + errors.join(', ');
         }
      }
   },
   decorate(decoration, config) {
      if (lodash.isString(decoration)) {
         let file = decoration;
         assert(Files.existsFileSync(file), 'file: ' + file);
         decoration = these.read(file);
      }
      if (decoration.defaults) {
         config = Object.assign({}, decoration.defaults, config);
         logger.debug('decorate default', decoration.defaults, config);
      }
      return config;
   },
   readClassDecorationMaybe(classFile) {
      let yamlFile = these.getYamlFile(classFile);
      let className = path.basename(yamlFile, '.yaml');
      return YamlFiles.readFileSyncMaybe(yamlFile);
   },
   decorateClass(classFile, config) {
      these.readClassDecorationMaybe(classFile).then(decoration => {
         if (!decoration.defaults) {
            logger.warn('decorateClass: no defaults:', classFile);
         } else {
            config = Object.assign(decoration.defaults, config);
            these.assert(decoration, config, classFile);
            logger.debug('decorateClass', classFile, config);
         }
      }, err => {
         logger.warn('decorateClass: no decoration:', classFile);
         return config;
      });
      return config;
   }
};

module.exports = these;
