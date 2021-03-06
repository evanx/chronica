
// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

import express from 'express';

import ExpressResponses from '../lib/ExpressResponses';


export function create(config, logger, context) {

   let app, server;
   let state = { config };

   logger.info('publishComponents', config.publishComponents);
   logger.info('publishStores', config.publishStores);
   logger.info('publishLogging', config.publishLogging);

   if (config.alertLink) {
      context.stores.environment.alertLink = config.alertLink;
   }

   async function getReport() {
      let report = {};
      config.publishComponents.forEach(async (name) => {
         logger.debug('getReport', name);
         if (config.publishComponents)
         try {
            let publishableData = await context.components[name].pub();
            if (publishableData) {
               report[name] = publishableData;
               logger.debug('getReport', name, publishableData);
            }
         } catch (err) {
            logger.warn('getReport store', name, err);
         }
      });
      config.publishStores.forEach(async (name) => {
         logger.debug('getReport', name);
         try {
            report[name] = await context.stores[name].pub();
         } catch (err) {
            logger.warn('getReport store', name, err);
         }
      });
      let logging = Loggers.pub();
      report.logging = {};
      config.publishLogging.forEach(name => {
         report.logging[name] = logging[name];
      });
      return report;
   }

   function getPaths() {
      return app._router.stack.filter(middleware => middleware.route)
         .map(middleware => middleware.route.path);
   }

   const those = {
      async pub() {
         return { alertLink: config.alertLink };
      },
      async start() {
         app = express();
         app.get(config.location, async (req, res) => {
            try {
               res.json(await getReport());
            } catch (err) {
               res.status(500).send(err);
            }
         });
         app.get(config.location + '/:serviceName', async (req, res) => {
            try {
               res.json(context.stores.service.pubName(req.params.serviceName));
            } catch (err) {
               res.status(500).send(err);
            }
         });
         app.get('/', async (req, res) => {
            res.json(await getReport());
         });
         server = app.listen(config.port);
         state.hostname = context.stores.environment.hostname;
         logger.info('listening', state);
      },
      async end() {
         if (server) {
            server.close();
            logger.info('end');
         } else {
            logger.warn('end');
         }
      },
   };

   return those;
}
