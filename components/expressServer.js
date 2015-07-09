
// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

import express from 'express';

import ExpressResponses from '../lib/ExpressResponses';


export function create(config, logger, context) {

   let app, server;
   let state = { config };

   function getReport() {
      let report = {};
      Object.keys(context.stores).forEach(name => {
         try {
            report[name] = context.stores[name].state;
         } catch (err) {
            logger.warn('getReport store', name, err);
         }
      });
      Object.keys(context.components).forEach(name => {
         try {
            report[name] = context.components[name].state;
         } catch (err) {
            logger.warn('getReport store', name, err);
         }
      });
      return report;
   }
   const those = {
      get state() {
         return { state };
      },
      async start() {
         app = express();
         app.get(config.location, async (req, res) => {
            res.json(getReport());
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
