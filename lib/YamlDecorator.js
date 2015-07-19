
import assert from 'assert';
import path from 'path';
import lodash from 'lodash';
import util from 'util';

import * as YamlAsserts from './YamlAsserts';

let logger = Loggers.create(module.filename, 'info');

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
   decorateClass(classFile, config) {
      these.readClassDecorationMaybe(classFile).then(decoration => {
         if (decoration.requiredComponents) {
            config.requiredComponents = decoration.requiredComponents;
         } else {
            logger.warn('decorateClass: no requiredComponents:', classFile);
         }
         if (decoration.defaults) {
            config = Object.assign(decoration.defaults, config);
            these.assert(decoration, config, classFile);
            logger.debug('decorateClass', classFile, config);
         } else {
            logger.warn('decorateClass: no defaults:', classFile);
         }
      }, err => {
         logger.warn('decorateClass: no decoration:', classFile);
         return config;
      });
      return config;
   }
};

module.exports = these;
