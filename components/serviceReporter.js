// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

export function create(config, logger, context) {

   const that = {
   };

   function serviceLine(service) {
      logger.warn('service', service);
      if (service.status) {
         return '' + service.status + ' ' + service.name;
      } else {
         return service.name;
      }
   }

   const those = {
      async start() {
         logger.info('started');
      },
      async end() {
      },
      async serviceReport() {
         let lines = [], none = [], ok = [], critical = [], other = [];
         logger.info('services', context.stores.service.services.size);
         for (let [name, service] of context.stores.service.services) {
            if (!service.status) {
               none.push(service.name);
            } else if (service.status === 'OK') {
               ok.push(service.name);
            } else if (service.status === 'CRITICAL') {
               critical.push(service.name);
            } else {
               lines.push(serverLine(service));
            }
         }
         if (critical.length) {
            lines.push('CRITICAL: ' + critical.join(' '));
         }
         if (ok.length) {
            lines.push('OK: ' + ok.join(' '));
         }
         if (none.length) {
            none.forEach(name => {
               lines.push('Unchecked: ' + none.join(' '));
            }
         }
         return lines;
      }
   };
   return those;
}
