// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

export function create(config, logger, context) {

   function getEventType(service, status) {
      if (!service.status) { // no status i.e. app restarted
         return 'initial';
      } else if (service.status !== status) { // status changed
         return 'changed';
      } else { // status unchanged
         if (service.statusCount === config.debounceCount) {
            return 'debounced';
         } else if (service.statusCount < config.debounceCount) {
            return 'debouncing';
         } else {
            return 'unchanged';
         }
      }
   }

   function setServiceStatus(service, status, eventType) {
      if (eventType === 'initial') {
         assert(!service.status, 'initial');
         service.status = status;
         service.alertedStatus = service.status;
         service.statusCount = config.debounceCount;
      } else if (eventType === 'changed') {
         assert(service.status != status, 'status changed');
         service.statusCount = 0;
         service.status = status;
      } else {
         assert(service.status == status, 'status unchanged', service.statusCount);
         service.statusCount += 1;
      }
   }

   function isAlertableEvent(eventType) {
      if (eventType === 'debounced') {
         return true;
      } else if (eventType === 'changed' && config.debounceCount === 0) {
         return true;
      } else {
         return false;
      }
   }

   const those = {
      async pub() {
         return null;
      },
      async start() {
         logger.info('started');
      },
      async end() {
      },
      async processStatus(service, status, message) {
         logger.debug('processStatus', service.name, status, message);
         let eventType = getEventType(service, status);
         setServiceStatus(service, status, eventType);
         if (!isAlertableEvent(eventType)) {
            logger.debug('not alertable event:', service.name, eventType, service.status);
         } else if (service.alertedStatus === service.status) {
            logger.debug('equal alertedStatus:', service.name, eventType, service.status);
         } else {
            logger.info('send alert:', service.name, eventType, service.status, service.alertedStatus);
            service.alertedStatus = service.status;
            try {
               context.components.reporter.sendAlert(service.status + ' ' + service.name, message);
            } catch (err) {
               logger.error('sendAlert', service.name, service.status);
            }
         }
      }
   };
   return those;
}
