// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

import * as YamlAsserts from '../lib/YamlAsserts';

export default class HtmlMonitor {

   constructor(config, logger, context) {
      this.config = config;
      this.logger = logger;
      this.context = context;
      this.init();
   }

   init() {
      for (let name in this.config.services) {
         this.logger.info('service', name);
         let service = this.config.services[name];
         service.name = name;
         service.type = 'html';
         assert(service.url, 'service.url');
         assert(service.name, 'service.name');
         if (!service.content) {
            this.logger.warn('no content requirements', service.name);
         }
         if (!service.label) {
            service.label = service.name;
         }
         this.context.stores.service.add(service);
      }
   }

   async checkServices() {
      for (const [name, service] of this.context.stores.service.services) {
         if (service.type === 'html') {
            await this.checkService(service);
         }
      }
   }

   checkContentRegex(service, response, content) {
      this.logger.debug('checkServiceRegex', service.name);
      let errors = lodash(service.content).keys().map(key => {
         let expected = service.content[key];
         let value;
         let regex = this.config.regex[key];
         try {
            assert(regex, 'regex: ' + key);
            let matcher = content.match(new RegExp(regex));
            assert(matcher && matcher.length > 1, key);
            value = lodash.trim(matcher[1]);
            service.debug[key] = value;
            assert.equal(value, service.content[key], key);
            this.logger.digest('content', key, regex, value, expected);
         } catch (err) {
            this.logger.digest('content', key, regex, value, expected, err.message);
            return err;
         }
      }).compact().value();
      if (errors.length) {
         throw errors[0];
      }
   }

   checkContentContains(service, response, content) {
      this.logger.debug('checkServiceContains', service.name);
      let errors = lodash(service.contains).keys().map(key => {
         let string = service.contains[key];
         this.logger.debug('checkContentContains', string);
         try {
            assert(content.indexOf(string) >= 0, key);
         } catch (err) {
            this.logger.digest('checkContentContains', key, err.message);
            return err;
         }
      }).compact().value();
      if (errors.length) {
         throw errors[0];
      }
   }

   checkContentMatches(service, response, content) {
      this.logger.debug('checkServiceMatches', service.name);
      let errors = lodash(service.matches).keys().map(key => {
         let regex = service.matches[key];
         this.logger.debug('checkContentMatches', regex);
         try {
            let match = content.match(new RegExp(regex));
            this.logger.digest('checkContentMatches', match? Object.keys(match): null);
            assert(match, key);
         } catch (err) {
            this.logger.digest('checkContentMatches', key, err.message);
            return err;
         }
      }).compact().value();
      if (errors.length) {
         throw errors[0];
      }
   }

   checkServiceContent(service, response, content) {
      this.logger.debug('checkServiceContent', service.name);
      assert(!lodash.isEmpty(content), 'content');
      assert(lodash.startsWith(response.headers['content-type'], 'text/html'), 'content type');
      let contentLength = response.headers['content-length'];
      if (!contentLength) {
         this.logger.digest('response.headers', service.name, Object.keys(response.headers).join(', '));
      } else {
         this.logger.digest('content', service.name, contentLength, content.length);
         if (false) {
            assert.equal(parseInt(contentLength), content.toString().length, 'content length');
         }
      }
      if (service.content) {
         this.checkContentRegex(service, response, content);
      }
      if (service.contains) {
         this.checkContentContains(service, response, content);
      }
      if (service.matches) {
         this.checkContentMatches(service, response, content);
      }
   }

   async checkService(service) {
      try {
         this.logger.verbose('checkService', service.name);
         let options = {
            url: service.url,
            method: 'get',
            timeout: this.config.timeout
         };
         service.debug.url = service.url;
         if (service.headers) {
            options.headers = service.headers;
            service.debug['User-Agent'] = service.headers['User-Agent'];
            this.logger.verbose('request', options);
         }
         let [response, content] = await Requests.response(options);
         this.logger.verbose('response', service.name, response.statusCode, service.headers);
         if (service.statusCode) {
            service.debug.statusCode = response.statusCode;
            assert.equal(response.statusCode, service.statusCode, 'statusCode: ' + service.statusCode);
         } else {
            assert.equal(response.statusCode, 200, 'statusCode');
         }
         if (response.statusCode === 200) {
            this.checkServiceContent(service, response, content);
         }
         await this.context.components.tracker.processStatus(service, 'OK');
      } catch (err) {
         service.debug.error = {
            message: err.message || err,
            time: new Date()
         };
         if (err.stack) {
            this.logger.vdebug(err.stack);
         }
         this.context.components.tracker.processStatus(service, 'WARN', err.message);
      }
   }

   async pub() {
      return { };
   }

   async start() {
      this.logger.info('started');
   }

   async end() {
   }

   async scheduledTimeout() {
      this.logger.verbose('scheduledTimeout');
      await this.checkServices();
   }

   async scheduledInterval() {
      this.logger.verbose('scheduledInterval');
      await this.checkServices();
   }
}
