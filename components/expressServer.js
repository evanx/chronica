
// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

import express from 'express';

import ExpressResponses from '../lib/ExpressResponses';

export function create(config, logger, components, state) {

   let app, server, listening;

   const those = {
      get state() {
         return { config, listening };
      },
      async start() {
         app = express();
         logger.info('listening', config.port);
         app.get(config.location, async (req, res) => {
            res.json(those.state);
         });
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
