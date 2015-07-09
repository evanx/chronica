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
      let none = [], ok = [], critical = [], other = [];
      for (let [name, service] of context.stores.service.services) {
         if (!service.status) {
            none.push(service.name);
         } else if (service.status === 'OK') {
            ok.push(service.name);
         } else if (service.status === 'WARN') {
            critical.push(service.name);
         } else {
            lines.push(serverLine(service));
         }
      }
      return { none, ok, critical, other };
   }

   const those = {
      async getPublic() {
         return await getReport();
      },
      async start() {
         logger.info('started');
      },
      async end() {
      },
      async serviceReport() {
         let lines = [];
         let report = getReport();
         if (report.critical.length) {
            lines.push('WARN: ' + report.critical.join(' '));
         }
         if (report.ok.length) {
            lines.push('OK: ' + report.ok.join(' '));
         }
         if (report.none.length) {
            report.none.forEach(name => {
               lines.push('Unchecked: ' + report.none.join(' '));
            });
         }
         return lines;
      }
   };
   return those;
}
