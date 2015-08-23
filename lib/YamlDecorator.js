
import assert from 'assert';
import path from 'path';
import lodash from 'lodash';
import util from 'util';

import * as YamlAsserts from './YamlAsserts';

let logger = Loggers.create(module.filename, 'debug');

const these = {
   getYamlFile(file) {
      file = file.replace(/\.[a-z]+$/, '');
      file += '.yaml';
      return file;
   },
   assert(decoration, config, name) {
      if (decoration.asserts) {
         let errors = YamlAsserts.getErrors(decoration.asserts, config);
         if (errors.length) {
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
      logger.debug('readClassDecorationMaybe', classFile, yamlFile);
      return YamlFiles.readFileSyncMaybe(yamlFile);
   },
   assign(classFile, config, decoration) {
      logger.debug('assign', decoration.assign);
      assert(lodash.isArray(decoration.assign), 'assign');
      decoration.assign.forEach(key => {
         let object = decoration.defaults[key];
         logger.debug('assign', key, object);
         if (!object) {
            logger.warn('assign', classFile, key);
         } else if (!lodash.isObject(object)) {
            logger.error('assign', classFile, key, typeof object);
         } else if (!lodash.isObject(config[key])) {
            logger.error('assign', classFile, key);
         } else {
            config[key] = Object.assign(decoration.defaults[key], config[key]);
         }
      });
   },
   concat(classFile, config, decoration) {
      logger.debug('concat', decoration.concat);
      assert(lodash.isArray(decoration.concat), 'concat');
      decoration.concat.forEach(key => {
         let array = decoration.defaults[key];
         logger.debug('concat', decoration.concat, key, array);
         if (!array) {
            logger.warn('concat', classFile, key);
         } else if (!lodash.isArray(array)) {
            logger.error('concat', classFile, key, typeof array);
         } else if (!lodash.isArray(config[key])) {
            logger.error('concat', classFile, key);
         } else {
            config[key] = config[key].concat(array);
         }
      });
   },
   decorateClass(classFile, config) {
      logger.vdebug('decorateClass', classFile);
      return these.readClassDecorationMaybe(classFile).then(decoration => {
         if (decoration.requiredComponents) {
            config.requiredComponents = decoration.requiredComponents;
         } else {
            logger.warn('decorateClass: no requiredComponents:', classFile);
         }
         logger.vdebug('decorateClass', Object.keys(decoration));
         if (decoration.defaults) {
            try {
               logger.vdebug('decorateClass defaults', Object.keys(decoration.defaults));
               if (decoration.concat) {
                  these.concat(classFile, config, decoration);
               }
               if (decoration.assign) {
                  these.assign(classFile, config, decoration);
               }
               config = Object.assign(decoration.defaults, config);
               if (decoration.assign) {
                  logger.vdebug('assign', config);
               }
               these.assert(decoration, config, path.basename(classFile));
               logger.debug('decorateClass', classFile);
            } catch (err) {
               logger.warn(err);
            }
         } else {
            logger.warn('decorateClass: no defaults:', classFile);
         }
         return config;
      }).elseValue(config);
   }
};

module.exports = these;
