
// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

import express from 'express';

import ExpressResponses from '../lib/ExpressResponses';


export function create(config, logger, required) {

   let app, server;
   let state = { config };

   const those = {
      get state() {
         return { state };
      },
      async start() {
         app = express();
         app.get(config.location, async (req, res) => {
            res.json(those.state);
         });
         server = app.listen(config.port);
         state.hostname = required.stores.environment.hostname;
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
