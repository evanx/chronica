
// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

import express from 'express';

import ExpressResponses from '../lib/ExpressResponses';


export function create(config, logger, context) {

   let app, server;
   let state = { config };

   async function getReport() {
      let report = {};
      for (let name in context.stores) {
         logger.debug('getReport', name);
         try {
            report[name] = await context.stores[name].getPublic();
         } catch (err) {
            logger.warn('getReport store', name, err);
         }
      }
      for (let name in context.components) {
         logger.debug('getReport', name);
         try {
            let publishableData = await context.components[name].getPublic();
            if (publishableData) {
               report[name] = publishableData;
               logger.debug('getReport', name, publishableData);
            }
         } catch (err) {
            logger.warn('getReport store', name, err);
         }
      }
      return report;
   }

   function getPaths() {
      let paths = [];
      app._router.stack.forEach(middleware => {
         if (middleware.route) {
            paths.push(middleware.route.path);
         }
      });
      return paths;
   }

   const those = {
      async getPublic() {
         return null;
      },
      async start() {
         app = express();
         app.get(config.location, async (req, res) => {
            res.json(await getReport());
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
