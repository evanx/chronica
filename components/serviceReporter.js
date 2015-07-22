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

   async function getReport() {
      let none = [], ok = [], warn = [], other = [];
      for (let [name, service] of context.stores.service.services) {
         if (!service.status) {
            none.push(service.name);
         } else if (service.status === 'OK') {
            //ok.push(service.name);
         } else if (service.status === 'WARN') {
            let name = service.name.replace(/^[a-z]+:/, '');
            if (!lodash.includes(warn, name)) {
               warn.push(name);
            }
         } else {
            other.push(serverLine(service));
         }
      }
      return { none, ok, warn, other };
   }

   const those = {
      async pub() {
         return await getReport();
      },
      async start() {
         logger.info('started');
      },
      async end() {
      },
      async serviceReport() {
         let lines = [];
         let report = await getReport();
         if (report.warn.length) {
            lines.push('WARN: ' + report.warn.join(' '));
         }
         if (report.ok.length) {
            lines.push('OK: ' + report.ok.join(' '));
         }
         if (report.none.length) {
            lines.push('Unchecked: ' + report.none.join(' '));
         }
         report.other.forEach(line => {
            lines.push(line);
         });
         return lines;
      }
   };
   return those;
}
