// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

export function create(config, logger, context) {

   const that = {
   };

   assert(config.peers, 'peers');
   for (let name in config.peers) {
      let peer = config.peers[name];
      if (typeof peer === 'string') {
         peer = {url: peer};
      }
      logger.debug('peer', peer);
      let service = Object.assign({}, peer);
      service.name = 'peer:' + name;
      service.type = 'url';
      service.subtype = 'peer';
      context.stores.service.add(service);
   }

   async function getPeers() { // TODO filter ok peers from service store
      return await* Object.keys(config.peers).map(async (name) => {
         try {
            let peer = config.peers[name];
            if (typeof peer === 'string') {
               peer = {url: peer};
            }
            let data = await Requests.request({url: peer.url, json: true, timeout: 4000});
            return data.alerter;
         } catch (err) {
            logger.warn('peer', name, err);
            return {};
         }
      });;
   }

   async function isPeerAlert() {
      try {
         let peers = await getPeers();
         let peerTime = lodash(peers).compact()
            .map(peer => peer.alertedTime).compact()
            .filter(time => time).sort().last();
         if (peerTime) {
            let elapsedDuration = new Date().getTime() - new Date(peerTime).getTime();
            logger.warn('peer elapsed', elapsedDuration);
            return elapsedDuration < config.elapsedThreshold;
         }
      } catch (err) {
         logger.warn('peer', err.stack);
      }
      return false;
   }

   const those = {
      async pub() {
         return that;
      },
      async start() {
      },
      async end() {
      },
      async sendAlert(subject, message) {
         if (that.alertTime &&
               new Date().getTime() - that.alertTime.getTime() < config.elapsedThreshold) {
            that.alertTime = new Date();
            logger.warn('not elapsed:', {subject, message});
            return false;
         }
         that.alertTime = new Date();
         if (await isPeerAlert()) {
            logger.warn('peer alert not elapsed:', {subject, message});
         } else if (lodash.includes(config.disableHostnames, context.stores.environment.hostname)) {
            logger.info('disabled', subject, context.stores.environment.hostname);
         } else if (!context.components.emailMessenger && !context.components.slackMessenger) {
            logger.error('no messengers');
         } else {
            that.alertedTime = new Date();
            logger.warn('sendAlert', that.alertedTime, {subject, message});
            if (context.components.slackMessenger) {
               try {
                  await context.components.slackMessenger.sendAlert(subject, message);
               } catch (err) {
                  logger.error(err, 'sendAlert slack');
               }
            }
            if (context.components.emailMessenger) {
               try {
                  await context.components.emailMessenger.sendAlert(subject, message);
               } catch (err) {
                  logger.error(err, 'sendAlert email');
               }
            }
            return true;
         }
         return false;
      }
   };

   return those;
}
